# Sentry Signal Cockpit — demo container image.
# Railway can build this directly via railway.json (Nixpacks) instead; this
# Dockerfile is provided as an alternative build path for any Docker-based
# host.
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
COPY data ./data

EXPOSE 8787
CMD ["node", "server/index.js"]
