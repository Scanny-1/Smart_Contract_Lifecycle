# Stage 1: Build the React Application
FROM node:20-slim AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

# Accept build arguments for environment variables
ARG VITE_API_URL
ARG VITE_SERVER_URL

# Expose them to the build environment
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL

COPY . .
RUN npm run build

# Stage 2: Serve the Built Application with Nginx
FROM nginx:alpine
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
