# Multi-stage build for Railway deployment
FROM public.ecr.aws/docker/library/node:20-alpine AS builder

# Cache buster - change this to force rebuild
ARG CACHEBUST=2026-01-08-v2

WORKDIR /app

# Copy manifests first for better caching
COPY package*.json ./

# Install deps (include dev deps for build)
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# Copy source and build
COPY . .
RUN npm run build && \
    # Remove unnecessary files after build
    rm -rf node_modules/.cache

# Production stage
FROM public.ecr.aws/docker/library/node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# Copy server code and built frontend
COPY --chown=node:node server ./server
COPY --from=builder --chown=node:node /app/dist ./dist

# Create necessary directories with proper permissions
RUN mkdir -p /app/uploads /app/logs && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application with dumb-init for proper signal handling
CMD ["dumb-init", "node", "server/index.js"]
