# Frontend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies (skip optional to avoid Cypress)
RUN npm install --production=false --ignore-scripts

# Copy frontend source code
COPY apps/frontend ./apps/frontend

# Build the frontend
RUN npx nx build frontend --prod

# Production stage with nginx
FROM nginx:alpine AS production

# Copy built application to nginx
COPY --from=builder /app/dist/apps/frontend/browser /usr/share/nginx/html

# Copy nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
