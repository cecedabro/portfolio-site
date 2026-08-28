# Deploying to the k3s cluster

The site is a static Vite build served by nginx. It ships as a container image
on GitHub Container Registry, runs as a 2-replica Deployment in the `portfolio`
namespace, and is reached from the internet through the existing Cloudflare
Tunnel — no Ingress, no MetalLB address.

```
push to main ──► GitHub Actions ──► ghcr.io/cecedabro/portfolio-site:{latest,sha-XXXX}
                                              │
                          kubectl set image / apply
                                              ▼
        cloudflared ──► Service portfolio-site:80 ──► Deployment (nginx :8080, x2)
```

## One-time setup

### 1. Let the cluster pull the image

CI pushes to `ghcr.io/cecedabro/portfolio-site`. New GHCR packages are
**private** by default. Pick one:

**Make it public** (simplest — it's a public portfolio anyway):
GitHub → your profile → Packages → `portfolio-site` → Package settings →
Change visibility → Public. Nothing else to configure.

**Or keep it private** and give the namespace a pull secret:

```bash
# A classic PAT with read:packages scope, or a fine-grained token with
# "Packages: read" on this repo.
kubectl create secret docker-registry ghcr \
  --namespace portfolio \
  --docker-server=ghcr.io \
  --docker-username=cecedabro \
  --docker-password='<PAT>' \
  [email protected]
```

Then uncomment `imagePullSecrets` in `k8s/10-deployment.yaml`.

### 2. First apply

```bash
kubectl apply -f k8s/
kubectl -n portfolio rollout status deployment/portfolio-site
```

`k8s/` files are numbered so `kubectl apply -f k8s/` creates the namespace
before the objects that live in it.

### 3. Add a public hostname on the Cloudflare tunnel

The `cloudflared` pods in the `cloudflare` namespace run a **dashboard-managed**
tunnel (their names end in `-remote`), so routes live in the Cloudflare Zero
Trust dashboard — the same place the Jellyfin hostname is configured, not a file
in the cluster.

1. Cloudflare **Zero Trust → Networks → Tunnels** → your tunnel → **Public
   Hostname** tab → **Add a public hostname**.
2. **Subdomain / Domain**: the hostname you want (e.g. `cedricschippers.dev`, or
   `www`). Cloudflare adds the DNS record automatically if the domain is on this
   account.
3. **Service** → Type `HTTP`, URL:
   ```
   portfolio-site.portfolio.svc.cluster.local:80
   ```
   The cloudflared pod runs inside the cluster, so it resolves this Kubernetes
   Service name directly — no LoadBalancer IP, no MetalLB address needed.
4. Save.

TLS terminates at Cloudflare's edge; the tunnel talks plain HTTP to the pod
inside the cluster, which is why the Service and nginx only use port 80 / 8080.

> **Want it to look like your other apps instead?** Every other service in your
> cluster is `type: LoadBalancer` on a `192.168.50.x` MetalLB IP. To match that,
> change `k8s/20-service.yaml` to `type: LoadBalancer`, pin a free IP with an
> annotation (`metallb.universe.tf/loadBalancerIPs: 192.168.50.NNN`), and put
> `http://192.168.50.NNN:80` as the tunnel's Service URL. Functionally the same;
> it just uses one IP from your pool and lets you open the site on the LAN.

## Updating the site

Every push to `main` builds and pushes a new image tagged `latest` and
`sha-<short-git-sha>`. To roll the cluster to a specific build:

```bash
kubectl -n portfolio set image deployment/portfolio-site \
  nginx=ghcr.io/cecedabro/portfolio-site:sha-1a2b3c4
kubectl -n portfolio rollout status deployment/portfolio-site
```

Or `make rollout TAG=sha-1a2b3c4`.

Using an immutable `sha-` tag (rather than re-pulling `latest`) means the
Deployment spec records exactly what's running, and rollback is trivial:

```bash
kubectl -n portfolio rollout undo deployment/portfolio-site
```

The rollout is zero-downtime: `maxUnavailable: 0`, and the readiness probe
gates new pods on `/healthz` before old ones are removed. The
PodDisruptionBudget keeps at least one pod up during node drains.

## Build and test locally

```bash
make run           # builds, then runs it exactly as k8s will, on :8080
curl -sI localhost:8080/            # cache + security headers
curl -s  localhost:8080/healthz     # -> ok
```

`make run` uses `--read-only --tmpfs /tmp --tmpfs /var/cache/nginx`, matching
the pod's `readOnlyRootFilesystem` + emptyDir mounts. If nginx ever complains
about another unwritable path, add it as one more `emptyDir` in the Deployment.

## Notes

- `k8s/` is plain YAML. The image tag is the only value you change per release
  — by hand, with `kubectl set image`, or `make rollout`.
- Resource limits are deliberately tiny (10m CPU / 32Mi request). Static nginx
  serving a handful of files needs almost nothing.
- CI only builds and pushes — the cluster is not reachable from GitHub runners,
  so the `kubectl` step stays manual (or wire it to a self-hosted runner / a
  pull-based tool like Flux or Argo CD later).
- This does **not** use Traefik. Traefik ships with k3s and is running, but the
  cluster has no Ingress resources — every app is reached by IP or by the
  tunnel. This site follows the tunnel path, so no Ingress here either.
