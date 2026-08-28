# portfolio-site

Static site built with Vite (TypeScript + hand-written HTML/CSS), served by
nginx on a bare-metal k3s cluster.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
```

## Deploy

Containerised (`Dockerfile`), pushed to GHCR by GitHub Actions on every push to
`main`, run as a Deployment in `k8s/`, exposed via Cloudflare Tunnel.
Full runbook: [docs/DEPLOY.md](docs/DEPLOY.md).

```bash
make run                       # build + run the image locally on :8080
kubectl apply -f k8s/          # first deploy
make rollout TAG=sha-1a2b3c4   # roll to a specific built image
```
