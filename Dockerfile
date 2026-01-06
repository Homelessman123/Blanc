# =============================================================================
# OPTIMIZED MULTI-STAGE DOCKERFILE FOR RAILWAY
# =============================================================================
# This Dockerfile builds both frontend and backend in a single optimized image
# Perfect for Railway deployment with Redis support

# Build stage for frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with clean npm cache
RUN npm ci --legacy-peer-deps --prefer-offline --no-audit && \
    npm cache clean --force

# Copy only necessary source code for build
COPY index.html ./
COPY vite.config.ts tsconfig.json ./
COPY tailwind.config.js postcss.config.js ./
COPY *.ts *.tsx *.css ./
COPY public ./public
COPY components ./components
COPY pages ./pages
COPY lib ./lib
COPY hooks ./hooks
COPY contexts ./contexts
COPY constants ./constants
COPY services ./services
COPY utils ./utils

# Build frontend with optimizations
ENV NODE_ENV=production
RUN npm run build

# =============================================================================
# Production stage
# =============================================================================
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files for backend
COPY package*.json ./

# Install production dependencies only with cache optimization
RUN npm ci --omit=dev --legacy-peer-deps --prefer-offline --no-audit && \
    npm cache clean --force

# Copy backend server
COPY --chown=nodejs:nodejs server ./server

# Copy built frontend from builder stage
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Expose port (Railway will set PORT env var)
EXPOSE 4000

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start server
CMD ["node", "server/index.js"]
