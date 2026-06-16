# Stage 1: Build & Dependencies
FROM node:20-slim AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production Run
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .

# Expose server port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
