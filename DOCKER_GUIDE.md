# =============================================================================
# DOCKER QUICK START GUIDE
# =============================================================================

## 🐳 Development with Docker Compose

### Start all services (Postgres + Redis + App):
```bash
# First time setup
docker-compose up --build

# Subsequent runs
docker-compose up
```

### Run in background:
```bash
docker-compose up -d
```

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f redis
docker-compose logs -f postgres
```

### Stop services:
```bash
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

## 🚀 Production with Docker Compose

### Setup:
1. Copy environment template:
```bash
cp .env.docker .env.production
```

2. Edit `.env.production` with your credentials

3. Start services:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Commands:
```bash
# View status
docker-compose -f docker-compose.prod.yml ps

# Restart app
docker-compose -f docker-compose.prod.yml restart app

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop all
docker-compose -f docker-compose.prod.yml down
```

## 📊 Redis Management

### Connect to Redis CLI:
```bash
docker exec -it contesthub-redis redis-cli
```

### Useful Redis commands:
```redis
# Check connection
PING

# List all keys
KEYS *

# Get cache info
INFO memory

# Monitor commands in real-time
MONITOR

# Clear all cache
FLUSHALL

# Check specific key
GET your_key_name

# Set TTL
EXPIRE your_key 3600
```

### Redis performance stats:
```bash
docker exec -it contesthub-redis redis-cli INFO stats
```

## 🗄️ Database Management

### Connect to PostgreSQL:
```bash
docker exec -it contesthub-db psql -U postgres -d contesthub
```

### Run migrations:
```bash
docker-compose exec app npm run seed
```

### Backup database:
```bash
docker exec contesthub-db pg_dump -U postgres contesthub > backup.sql
```

### Restore database:
```bash
docker exec -i contesthub-db psql -U postgres contesthub < backup.sql
```

## 🔍 Troubleshooting

### Check container health:
```bash
docker ps
docker-compose ps
```

### Inspect container:
```bash
docker inspect contesthub-app
docker inspect contesthub-redis
```

### Check resource usage:
```bash
docker stats
```

### Clean up Docker:
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Nuclear option (remove everything)
docker system prune -a --volumes
```

### Rebuild from scratch:
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## 📈 Performance Tips

### Redis Memory Usage:
```bash
# Check current memory
docker exec contesthub-redis redis-cli INFO memory | grep used_memory_human

# Set max memory (already configured in compose)
# maxmemory 256mb (dev) or 512mb (prod)
```

### PostgreSQL Tuning:
Already optimized in `docker-compose.prod.yml`:
- max_connections=100
- shared_buffers=256MB
- effective_cache_size=1GB

### App Container:
Limited in prod compose:
- CPU: 1 core max, 0.5 reserved
- Memory: 1GB max, 512MB reserved

## 🔐 Security Notes

1. **Never commit** `.env.production` to git
2. Change default passwords in production
3. Use strong JWT_SECRET (32+ characters)
4. Enable SSL for PostgreSQL in production
5. Restrict Redis to localhost or use password

## 📦 Building Single Docker Image

### Build for Railway/production:
```bash
docker build -t contesthub:latest .
```

### Test locally:
```bash
docker run -p 4000:4000 \
  -e DATABASE_URL="your_db_url" \
  -e JWT_SECRET="your_secret" \
  -e REDIS_URL="redis://localhost:6379" \
  contesthub:latest
```

### Push to registry:
```bash
docker tag contesthub:latest your-registry/contesthub:latest
docker push your-registry/contesthub:latest
```

## 🌐 Railway vs Docker Compose

| Feature | Railway | Docker Compose |
|---------|---------|----------------|
| Redis Plugin | Auto-configured | Manual setup |
| Database | Managed Postgres | Self-hosted |
| Scaling | Built-in | Manual |
| SSL/HTTPS | Automatic | Manual (nginx) |
| Cost | $5/month free | Server costs |
| Setup Time | 5 minutes | 15-30 minutes |

**Recommendation**: 
- 🚀 Use **Railway** for production (easier, managed)
- 🐳 Use **Docker Compose** for development

---

**Happy Docker-ing! 🐳**
