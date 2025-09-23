# Frontend Dockerfile - Otimizado
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies with cache
RUN npm ci --only=production --ignore-scripts

# Development dependencies
FROM base AS dev-deps
WORKDIR /app
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
RUN npm ci --ignore-scripts

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=dev-deps /app/node_modules ./node_modules
COPY --from=dev-deps /app/package*.json ./
COPY --from=dev-deps /app/nx.json ./
COPY --from=dev-deps /app/tsconfig.base.json ./

# Copy source code
COPY apps/frontend ./apps/frontend

# Build with cache
RUN npx nx build frontend --prod

# Production stage with nginx
FROM nginx:alpine AS production

# Copy built application to nginx
COPY --from=builder /app/dist/apps/frontend/browser /usr/share/nginx/html

# Copy nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
