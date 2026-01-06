# Multi-stage build for Railway deployment
FROM public.ecr.aws/docker/library/node:20-alpine AS builder

WORKDIR /app

# Copy manifests first for better caching
COPY package*.json ./

# Install deps (include dev deps for build) and build
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM public.ecr.aws/docker/library/node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev --legacy-peer-deps

# Copy server code
COPY server ./server

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 4000

# Start application
CMD ["node", "server/index.js"]
