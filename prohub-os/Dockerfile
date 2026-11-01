# Single image for both the web app and the worker (choose with the command).
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
# Web:    docker run … prohub-os npm start
# Worker: docker run … prohub-os npm run worker
# Migrate:docker run … prohub-os npm run setup
CMD ["npm", "start"]
