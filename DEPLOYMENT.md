# Voxe Deployment Guide

## Production Deployment Checklist

### 1. Environment Variables

Create a `.env.local` file with the following production variables:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://your-domain.com
PORT=3000

# Chatwoot Configuration
CHATWOOT_BASE_URL=https://chatwoot.mcp4.ai
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_API_KEY=your_chatwoot_api_key_here

# n8n Integration
N8N_DUPLICATE_ENDPOINT=https://n8n.sost.work/webhook/duplicate-agent
N8N_BASE_URL=https://n8n.sost.work

# AI Services
OPENAI_API_KEY=sk-your_openai_api_key_here

# File System Paths
SKELETON_PATH=./data/templates/n8n_System_Message.md
DEMO_ROOT=./public/demos
DEMO_DOMAIN=your-domain.com

# Security
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.com

# Performance
NEXT_TELEMETRY_DISABLED=1
```

### 2. Server Requirements

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Memory**: Minimum 2GB RAM
- **Storage**: Minimum 10GB free space
- **OS**: Linux (Ubuntu 20.04+ recommended)

### 3. Deployment Commands

```bash
# Install dependencies
npm install --production

# Build the application
npm run build

# Start the production server
npm start

# Or use the deploy script
npm run deploy
```

### 4. Process Management

#### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start npm --name "localboxs" -- start

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor the application
pm2 monit
```

#### Using systemd

Create `/etc/systemd/system/localboxs.service`:

```ini
[Unit]
Description=Voxe AI Support Platform
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/localboxs
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable localboxs
sudo systemctl start localboxs
sudo systemctl status localboxs
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/localboxs`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

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

    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Public files
    location /public/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=3600";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/localboxs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate

#### Using Let's Encrypt (Free)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 7. Firewall Configuration

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 8. Monitoring & Logs

#### Application Logs
```bash
# PM2 logs
pm2 logs localboxs

# systemd logs
sudo journalctl -u localboxs -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### Health Check Endpoint
The application includes a health check at `/api/health` (if implemented).

### 9. Backup Strategy

```bash
# Backup application files
tar -czf localboxs-backup-$(date +%Y%m%d).tar.gz /path/to/localboxs

# Backup generated demos and system messages
tar -czf localboxs-data-backup-$(date +%Y%m%d).tar.gz /path/to/localboxs/public/demos /path/to/localboxs/public/system_messages /path/to/localboxs/data/registry
```

### 10. Performance Optimization

- Enable gzip compression in Nginx
- Use a CDN for static assets
- Implement Redis caching for API responses
- Monitor memory usage and scale accordingly
- Use a reverse proxy cache like Varnish (optional)

### 11. Security Considerations

- Keep Node.js and dependencies updated
- Use strong API keys and secrets
- Implement rate limiting
- Regular security audits
- Monitor for suspicious activity
- Use HTTPS everywhere
- Implement proper CORS policies

### 12. Troubleshooting

#### Common Issues:

1. **Port already in use**: Change PORT in environment variables
2. **Memory issues**: Increase server RAM or implement clustering
3. **SSL errors**: Check certificate paths and permissions
4. **API failures**: Verify all environment variables are set correctly
5. **File permissions**: Ensure proper ownership of application files

#### Debug Commands:
```bash
# Check if application is running
pm2 status
# or
sudo systemctl status localboxs

# Check port usage
sudo netstat -tlnp | grep :3000

# Check disk space
df -h

# Check memory usage
free -h
```

### 13. Updates & Maintenance

```bash
# Update application
git pull origin main
npm ci --production
npm run build
pm2 restart localboxs
# or
sudo systemctl restart localboxs
```

This deployment guide ensures your Voxe application runs securely and efficiently in production.
