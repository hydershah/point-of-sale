# Production Deployment Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Docker Deployment](#docker-deployment)
5. [Manual Deployment](#manual-deployment)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Security
- [ ] All environment variables are set properly (no placeholders)
- [ ] `NEXTAUTH_SECRET` is a strong random string (generated with `openssl rand -base64 32`)
- [ ] Database credentials are strong and unique
- [ ] All API keys are production keys (not test/dev keys)
- [ ] `.env` file is never committed to version control
- [ ] SSL/TLS certificates are configured
- [ ] Security headers are enabled (check `src/middleware.ts`)
- [ ] CORS origins are properly configured
- [ ] Rate limiting is enabled and configured

### Database
- [ ] PostgreSQL database is created
- [ ] Database connection string is correct
- [ ] Database migrations are committed to version control
- [ ] Backup strategy is in place
- [ ] Connection pooling is configured (recommend PgBouncer)

### Application
- [ ] All dependencies are installed and up to date
- [ ] Build process completes without errors
- [ ] TypeScript compilation has no errors
- [ ] No hardcoded secrets or demo data in code
- [ ] Logging is configured (Sentry, DataDog, etc.)
- [ ] Email service is configured (Resend, SendGrid, etc.)
- [ ] File storage is configured (AWS S3, Cloudinary, etc.)

### Infrastructure
- [ ] Server/container orchestration is ready
- [ ] Reverse proxy is configured (Nginx, Caddy, etc.)
- [ ] SSL certificates are installed
- [ ] Firewall rules are configured
- [ ] CDN is configured (optional but recommended)
- [ ] Load balancer is configured (for high availability)

---

## Environment Setup

### 1. Copy and Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit the file with your production values
nano .env
```

### 2. Required Environment Variables

```bash
# Database - Use production PostgreSQL server
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# NextAuth - CRITICAL: Generate a secure secret
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://your-domain.com"

# Application
NODE_ENV="production"
APP_DOMAIN="your-domain.com"
```

### 3. Optional But Recommended

```bash
# Stripe (for payments)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email Service
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@your-domain.com"

# AWS S3 (for file storage)
AWS_S3_BUCKET="your-bucket-name"
AWS_S3_REGION="us-east-1"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."

# Error Tracking
SENTRY_DSN="https://..."

# Feature Flags
FEATURE_ENABLE_2FA="true"
FEATURE_ENABLE_EMAIL_RECEIPTS="true"
```

---

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE pos_db;

# Create user with password
CREATE USER pos_user WITH ENCRYPTED PASSWORD 'your-secure-password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE pos_db TO pos_user;

# Exit
\q
```

### 2. Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify migrations
npx prisma migrate status
```

### 3. Create Initial Super Admin (PRODUCTION MODE)

```bash
# IMPORTANT: Set a strong password!
SUPER_ADMIN_PASSWORD='YourStrongPassword123!' \
SUPER_ADMIN_EMAIL='admin@your-domain.com' \
npm run seed

# DO NOT use SEED_DEMO_DATA=true in production!
```

### 4. Configure Database Backups

```bash
# Create backup script
cat > /usr/local/bin/backup-pos-db.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="pos_db_backup_${TIMESTAMP}.sql"

pg_dump -U pos_user -h localhost pos_db | gzip > ${BACKUP_DIR}/${FILENAME}.gz

# Keep only last 30 days of backups
find ${BACKUP_DIR} -name "pos_db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${FILENAME}.gz"
EOF

chmod +x /usr/local/bin/backup-pos-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-pos-db.sh") | crontab -
```

---

## Docker Deployment

### Option 1: Docker Compose (Recommended for single server)

```bash
# 1. Clone repository
git clone <your-repo-url>
cd POS

# 2. Create .env file with production values
cp .env.example .env
nano .env

# 3. Build and start services
docker-compose up -d

# 4. Check logs
docker-compose logs -f app

# 5. Health check
curl http://localhost:3000/api/health
```

### Option 2: Docker with Separate Database

```bash
# 1. Build Docker image
docker build -t pos-system:latest .

# 2. Run container
docker run -d \
  --name pos-app \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/pos_db" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e NODE_ENV="production" \
  --restart unless-stopped \
  pos-system:latest

# 3. Check health
docker exec pos-app wget -qO- http://localhost:3000/api/health
```

### Docker Compose with All Services

```bash
# Start everything (App + PostgreSQL + Redis + PgAdmin)
docker-compose --profile dev up -d

# Production (without PgAdmin)
docker-compose up -d app postgres redis

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Update and restart
git pull
docker-compose pull
docker-compose up -d --build
```

---

## Manual Deployment (Without Docker)

### 1. Install Dependencies

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib
```

### 2. Setup Application

```bash
# Clone repository
git clone <your-repo-url>
cd POS

# Install dependencies
npm ci --only=production

# Generate Prisma Client
npx prisma generate

# Build application
npm run build

# Run migrations
npx prisma migrate deploy
```

### 3. Setup Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "pos-system" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# View logs
pm2 logs pos-system

# Monitor
pm2 monit
```

### 4. Configure Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/pos-system

server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers (additional to app headers)
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
}
```

Enable and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Health check
curl https://your-domain.com/api/health

# Should return:
# {
#   "status": "healthy",
#   "database": "connected",
#   ...
# }
```

### 2. Create First Tenant (Super Admin Panel)

1. Navigate to `https://your-domain.com/super-admin`
2. Login with super admin credentials
3. Create first tenant/business

### 3. Configure DNS

```
# A Records
your-domain.com           -> Your-Server-IP
*.your-domain.com         -> Your-Server-IP

# For multi-tenant subdomains
tenant1.your-domain.com   -> Your-Server-IP
tenant2.your-domain.com   -> Your-Server-IP
```

### 4. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d *.your-domain.com

# Auto-renewal (certbot sets this up automatically)
sudo certbot renew --dry-run
```

---

## Monitoring & Maintenance

### 1. Setup Logging

Configure Sentry for error tracking:

```bash
# Add to .env
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
```

### 2. Monitor Application

```bash
# Using PM2
pm2 monit

# View logs
pm2 logs pos-system --lines 100

# Application metrics
pm2 list
```

### 3. Database Monitoring

```bash
# Check database size
psql -U pos_user -d pos_db -c "SELECT pg_size_pretty(pg_database_size('pos_db'));"

# Check active connections
psql -U pos_user -d pos_db -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
psql -U pos_user -d pos_db -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

### 4. Regular Maintenance

```bash
# Update dependencies (monthly)
npm update
npm audit fix

# Database vacuum (weekly)
psql -U pos_user -d pos_db -c "VACUUM ANALYZE;"

# Check disk space
df -h

# Monitor memory
free -h

# Check application logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check environment variables
cat .env | grep -v '^#' | grep -v '^$'

# Validate environment
node -e "require('./src/lib/env-validation').validateEnvironmentOrExit()"

# Check Node.js version
node --version  # Should be 20.x

# Check build
npm run build
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Check PostgreSQL is running
sudo systemctl status postgresql

# Check firewall
sudo ufw status

# Verify connection string
echo $DATABASE_URL
```

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Check certificate expiry
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Performance Issues

```bash
# Check memory usage
docker stats (if using Docker)
pm2 monit (if using PM2)

# Check database query performance
npm run prisma studio

# Enable query logging
# Add to DATABASE_URL: ?connect_timeout=10&pool_timeout=10&statement_cache_size=0&log=query
```

### Migration Issues

```bash
# Check migration status
npx prisma migrate status

# Reset database (CAUTION: DESTROYS ALL DATA)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name description
```

---

## Security Best Practices

1. **Regular Updates**: Keep Node.js, dependencies, and system packages updated
2. **Firewall**: Only expose ports 80, 443 (and 22 for SSH)
3. **Fail2ban**: Protect against brute force attacks
4. **Regular Backups**: Automated daily backups with offsite storage
5. **Monitoring**: Set up alerts for errors, downtime, and unusual activity
6. **Access Control**: Use SSH keys, disable root login, use strong passwords
7. **Secrets Rotation**: Regularly rotate API keys and database passwords
8. **Audit Logs**: Review application and system logs regularly

---

## Support

For issues and questions:
- Check logs: `docker-compose logs` or `pm2 logs`
- Health check: `curl http://localhost:3000/api/health`
- Database check: `psql $DATABASE_URL -c "SELECT version();"`

---

**Last Updated**: 2025-10-20
**Version**: 1.0.0
