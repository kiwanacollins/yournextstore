# Build context is the medusa/ monorepo root (../.. from this file) — npm workspaces
# resolve dependencies against the root package-lock.json, not a per-app one.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
RUN npm ci

COPY . .

WORKDIR /app/apps/backend

EXPOSE 9000

CMD ["npm", "run", "dev"]
