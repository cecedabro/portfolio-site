# syntax=docker/dockerfile:1

# ---- build stage ---------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies against the lockfile; cached until it changes.
COPY package.json package-lock.json ./
RUN npm ci

# Build the static site — runs `tsc && vite build`, output in /app/dist.
COPY . .
RUN npm run build

# ---- runtime stage ------------------------------------------------------
# nginx-unprivileged listens on 8080 and runs as uid 101 by default,
# so the pod can run with runAsNonRoot + a read-only root filesystem.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# Local `docker run` health only; Kubernetes uses its own probes.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:8080/healthz || exit 1
