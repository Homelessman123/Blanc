# Multi-stage build for Railway deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy everything
COPY . .

# Install all dependencies and build
RUN npm install --legacy-peer-deps && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copy server code
COPY server ./server

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 4000

# Start application
CMD ["node", "server/index.js"]
