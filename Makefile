IMAGE ?= ghcr.io/cecedabro/portfolio-site
TAG   ?= dev
NS    ?= portfolio

.PHONY: build run push deploy rollout status logs

## Build the image locally
build:
	docker build -t $(IMAGE):$(TAG) .

## Run it the way Kubernetes will (non-root, read-only rootfs) on :8080
run: build
	docker run --rm -p 8080:8080 \
		--read-only --tmpfs /tmp --tmpfs /var/cache/nginx \
		$(IMAGE):$(TAG)

## Push $(IMAGE):$(TAG) to the registry
push: build
	docker push $(IMAGE):$(TAG)

## Apply all manifests (namespace, deployment, service, PDB)
deploy:
	kubectl apply -f k8s/

## Point the running deployment at $(IMAGE):$(TAG) and wait for it
rollout:
	kubectl -n $(NS) set image deployment/portfolio-site nginx=$(IMAGE):$(TAG)
	kubectl -n $(NS) rollout status deployment/portfolio-site

## Show rollout history
status:
	kubectl -n $(NS) rollout history deployment/portfolio-site

## Tail pod logs
logs:
	kubectl -n $(NS) logs -l app.kubernetes.io/name=portfolio-site -f
