# Backend Dockerfile - Otimizado
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
COPY apps/backend ./apps/backend

# Build with cache
RUN npx nx build backend --prod --skip-nx-cache

# Production stage
FROM base AS production
WORKDIR /app

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist/apps/backend ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

CMD ["node", "main.js"]
