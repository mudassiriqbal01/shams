# Deployment Guide

## Prerequisites

### System Requirements
- Node.js 18+ 
- PostgreSQL 14+
- 2GB RAM minimum
- 10GB disk space

### Development Tools
- npm or yarn
- Git
- PostgreSQL client

---

## Local Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd project
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb shams_db

# Or using psql
psql -U postgres
CREATE DATABASE shams_db;
\q
```

### 4. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=shams_db
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRATION=24h
PORT=3000
NODE_ENV=development
```

### 5. Run Application
```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build
npm start
```

### 6. Verify Installation
```bash
curl http://localhost:3000
```

---

## Production Deployment

### Option 1: Traditional Server Deployment

#### 1. Prepare Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Setup PostgreSQL
```bash
sudo -u postgres psql
CREATE DATABASE shams_db;
CREATE USER shams_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE shams_db TO shams_user;
\q
```

#### 3. Deploy Application
```bash
# Clone repository
git clone <repository-url> /opt/shams-app
cd /opt/shams-app

# Install dependencies (production only)
npm ci --only=production

# Create .env file
cat > .env << EOF
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=shams_user
DATABASE_PASSWORD=secure_password
DATABASE_NAME=shams_db
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRATION=24h
PORT=3000
NODE_ENV=production
EOF

# Build application
npm run build

# Start with PM2
pm2 start dist/main.js --name shams-api
pm2 startup
pm2 save
```

#### 4. Setup Nginx Reverse Proxy
```bash
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/shams-api
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/shams-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Setup SSL with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

### Option 2: Docker Deployment

#### 1. Create Dockerfile
```dockerfile
# /home/engine/project/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

#### 2. Create docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: shams_db
      POSTGRES_USER: shams_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - shams-network

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USER: shams_user
      DATABASE_PASSWORD: secure_password
      DATABASE_NAME: shams_db
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRATION: 24h
      NODE_ENV: production
    depends_on:
      - postgres
    networks:
      - shams-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  shams-network:
    driver: bridge
```

#### 3. Deploy with Docker
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

---

### Option 3: Cloud Platform Deployment

#### AWS Elastic Beanstalk

1. Install EB CLI:
```bash
pip install awsebcli
```

2. Initialize EB:
```bash
eb init -p node.js-18 shams-api
```

3. Create environment:
```bash
eb create shams-prod
```

4. Deploy:
```bash
eb deploy
```

#### Heroku

1. Install Heroku CLI:
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

2. Create app:
```bash
heroku create shams-api
```

3. Add PostgreSQL:
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

4. Set environment variables:
```bash
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set NODE_ENV=production
```

5. Deploy:
```bash
git push heroku main
```

#### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure environment variables
3. Add PostgreSQL database
4. Deploy automatically on push

---

## Database Migrations

### Production Migration Strategy

1. **Backup Database**
```bash
pg_dump -U shams_user -d shams_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

2. **Test Migration Locally**
```bash
# On development
npm run migration:generate -- -n MigrationName
npm run migration:run
```

3. **Deploy Migration**
```bash
# On production
npm run migration:run
```

4. **Rollback if Needed**
```bash
npm run migration:revert
```

---

## Monitoring & Logging

### PM2 Monitoring
```bash
# View logs
pm2 logs shams-api

# Monitor processes
pm2 monit

# View process list
pm2 list
```

### Application Logs
Configure log rotation in production:

```bash
# Install logrotate
sudo apt install -y logrotate

# Create logrotate config
sudo nano /etc/logrotate.d/shams-api
```

```
/opt/shams-app/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Health Checks
Add health check endpoint:

```typescript
// In main.ts or separate health.controller.ts
@Get('/health')
health() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

### External Monitoring
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Performance Monitoring**: New Relic, Datadog
- **Error Tracking**: Sentry

---

## Backup Strategy

### Database Backups

#### Automated Daily Backups
```bash
# Create backup script
sudo nano /opt/scripts/backup-db.sh
```

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
DB_NAME="shams_db"
DB_USER="shams_user"

mkdir -p $BACKUP_DIR

pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$TIMESTAMP.sql.gz"
```

```bash
# Make executable
sudo chmod +x /opt/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /opt/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```

#### Restore from Backup
```bash
gunzip -c backup_20241201_020000.sql.gz | psql -U shams_user -d shams_db
```

---

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use strong database passwords
- [ ] Enable SSL/TLS for database connections
- [ ] Configure CORS for specific origins
- [ ] Set up firewall rules
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Use environment variables for secrets
- [ ] Enable database SSL mode
- [ ] Set up VPN for database access
- [ ] Implement IP whitelisting

---

## Performance Optimization

### Database Optimization
```sql
-- Create indexes
CREATE INDEX idx_tasks_module ON tasks(moduleType, moduleRecordId);
CREATE INDEX idx_tasks_assignee ON tasks(assigneeId);
CREATE INDEX idx_tasks_due_date ON tasks(dueDate);
CREATE INDEX idx_metric_cache_lookup ON metric_cache(moduleType, metricKey);

-- Analyze tables
ANALYZE tasks;
ANALYZE dashboards;
ANALYZE metric_cache;
```

### Application Optimization
- Enable compression in Nginx
- Configure connection pooling
- Implement Redis caching
- Use CDN for static assets

---

## Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs shams-api

# Check environment variables
pm2 show shams-api

# Restart application
pm2 restart shams-api
```

### Database Connection Issues
```bash
# Test database connection
psql -U shams_user -d shams_db -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql
```

### High Memory Usage
```bash
# Check memory usage
pm2 monit

# Restart with lower instances
pm2 delete shams-api
pm2 start dist/main.js --name shams-api --instances 2
```

---

## Maintenance

### Regular Tasks
- Weekly: Review logs for errors
- Monthly: Update dependencies
- Monthly: Review and optimize database
- Quarterly: Security audit
- Quarterly: Performance review

### Update Process
```bash
# Backup first
./backup-db.sh

# Pull latest changes
cd /opt/shams-app
git pull origin main

# Install dependencies
npm ci --only=production

# Build
npm run build

# Restart
pm2 restart shams-api

# Verify
curl http://localhost:3000/health
```

---

## Support

For issues or questions:
1. Check logs: `pm2 logs shams-api`
2. Review error messages
3. Check database connectivity
4. Verify environment variables
5. Review this documentation
6. Create issue in repository
