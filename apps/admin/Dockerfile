# Build stage
FROM public.ecr.aws/docker/library/node:20-alpine AS builder

WORKDIR /app

# Build arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_GEMINI_API_KEY
ARG RAILWAY_GIT_COMMIT_SHA

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV RAILWAY_GIT_COMMIT_SHA=$RAILWAY_GIT_COMMIT_SHA

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install if no package-lock.json)
RUN npm install --legacy-peer-deps --no-audit

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM public.ecr.aws/docker/library/nginx:alpine

# Railway expects the app to listen on $PORT; default to 80 locally.
ENV PORT=80

# Copy nginx template so the official nginx entrypoint can envsubst ${PORT}
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
