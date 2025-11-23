# VPS Deployment Guide - Espace Elite

## 📋 Pre-Deployment Checklist (Run on Development Machine)

### 1. Build Docker Image
```bash
# Build the Docker image
docker build -t espace-elite:latest .

# Tag for your Docker registry (replace YOUR_DOCKER_USERNAME)
docker tag espace-elite:latest YOUR_DOCKER_USERNAME/espace-elite:latest

# Push to Docker Hub
docker login
docker push YOUR_DOCKER_USERNAME/espace-elite:latest
```

---

## 🚀 VPS Setup Instructions

### Step 1: Connect to VPS
```bash
ssh your-user@your-vps-ip
```

### Step 2: Install Docker & Docker Compose (if not installed)
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version
```

### Step 3: Create Project Directory
```bash
# Create application directory
sudo mkdir -p /opt/espace-elite
cd /opt/espace-elite

# Set ownership
sudo chown -R $USER:$USER /opt/espace-elite
```

### Step 4: Create Environment File
```bash
# Create .env file
nano .env
```

**Paste this content (UPDATE the values):**
```env
# Database Configuration
DATABASE_URL="postgresql://postgres:YOUR_SECURE_PASSWORD@localhost:5432/elite_sante"
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD

# NextAuth Configuration
NEXTAUTH_SECRET="YOUR_GENERATED_SECRET_HERE"
NEXTAUTH_URL="https://your-domain.com"

# Application Settings
NODE_ENV=production
DATABASE_SSL_REJECT_UNAUTHORIZED="false"
DEFAULT_IMPORT_PASSWORD="12345"

# File Storage
FILE_STORAGE_PATH="/var/espace-elite-files"

# Docker Configuration
DOCKER_USERNAME=YOUR_DOCKER_USERNAME
```

**Generate a secure NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 5: Create Docker Compose File
```bash
nano docker-compose.yml
```

**Paste this content:**
```yaml
version: '3.8'

services:
  app:
    container_name: espace-elite-app
    image: ${DOCKER_USERNAME}/espace-elite:latest
    restart: always
    network_mode: "host"
    env_file:
      - .env
    volumes:
      - espace-elite-files:/var/espace-elite-files
    depends_on:
      - db

  db:
    container_name: espace-elite-db
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: elite_sante
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  espace-elite-files:
    driver: local
  postgres-data:
    driver: local
```

### Step 6: Create File Storage Directory
```bash
# Create storage directory with proper permissions
sudo mkdir -p /var/espace-elite-files
sudo chown -R 1001:1001 /var/espace-elite-files
sudo chmod -R 755 /var/espace-elite-files

# Verify permissions
ls -ld /var/espace-elite-files
```

### Step 7: Pull Docker Image
```bash
# Login to Docker Hub
docker login

# Pull the image
docker pull YOUR_DOCKER_USERNAME/espace-elite:latest
```

### Step 8: Start the Application
```bash
cd /opt/espace-elite

# Start all services
docker-compose up -d

# Check if containers are running
docker ps

# View logs
docker-compose logs -f app
```

### Step 9: Run Database Migrations
```bash
# Enter the container
docker exec -it espace-elite-app sh

# Run Prisma migrations
npx prisma migrate deploy

# Exit container
exit
```

### Step 10: Setup Nginx Reverse Proxy (Optional but Recommended)
```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/espace-elite
```

**Paste this Nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3001;
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

**Enable the site:**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/espace-elite /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 11: Setup SSL with Let's Encrypt (Optional but Recommended)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is automatic, but you can test it:
sudo certbot renew --dry-run
```

---

## 🔍 Verification & Testing

### Check Application Status
```bash
# Check running containers
docker ps

# Check application logs
docker-compose logs -f app

# Check database logs
docker-compose logs -f db

# Check Nginx status
sudo systemctl status nginx
```

### Test File Upload
1. Access your application at `https://your-domain.com`
2. Login as admin
3. Go to patients/companies section
4. Try uploading a file
5. Verify file appears in `/var/espace-elite-files/`

```bash
# Check uploaded files
sudo ls -la /var/espace-elite-files/patients/
sudo ls -la /var/espace-elite-files/companies/
```

---

## 🛠️ Maintenance Commands

### Update Application
```bash
# Pull new image
docker pull YOUR_DOCKER_USERNAME/espace-elite:latest

# Restart with new image
docker-compose down
docker-compose up -d

# Run migrations if needed
docker exec -it espace-elite-app npx prisma migrate deploy
```

### Backup Database
```bash
# Backup PostgreSQL
docker exec espace-elite-db pg_dump -U postgres elite_sante > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip backup_*.sql
```

### Backup Files
```bash
# Backup uploaded files
sudo tar -czf files_backup_$(date +%Y%m%d_%H%M%S).tar.gz /var/espace-elite-files/
```

### View Logs
```bash
# Application logs
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app

# Database logs
docker-compose logs -f db
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart app only
docker-compose restart app

# Restart database only
docker-compose restart db
```

---

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs app

# Check environment variables
docker exec espace-elite-app env

# Verify .env file
cat .env
```

### File Upload Issues
```bash
# Check directory permissions
ls -ld /var/espace-elite-files

# Fix permissions
sudo chown -R 1001:1001 /var/espace-elite-files
sudo chmod -R 755 /var/espace-elite-files

# Check disk space
df -h
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test database connection
docker exec espace-elite-db psql -U postgres -d elite_sante -c "SELECT 1"

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Port Already in Use
```bash
# Find process using port 3001
sudo lsof -i :3001

# Kill the process if needed
sudo kill -9 <PID>
```

---

## 📊 Monitoring

### Check Resource Usage
```bash
# Docker stats
docker stats

# Disk usage
df -h

# Memory usage
free -h

# Check Docker volumes
docker volume ls
docker volume inspect espace-elite-files
```

---

## 🔐 Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Generated secure NEXTAUTH_SECRET
- [ ] Configured firewall (ufw or iptables)
- [ ] SSL certificate installed
- [ ] Regular backups scheduled
- [ ] File upload directory has correct permissions
- [ ] Only necessary ports exposed (80, 443)
- [ ] Database not exposed to internet (using localhost)

### Configure Firewall
```bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check status
sudo ufw status
```

---

## 📝 Important Notes

1. **Docker Volume**: The `espace-elite-files` volume persists uploaded files even when containers are removed
2. **Backup Strategy**: Set up automated backups for both database and file storage
3. **Updates**: Always backup before updating the application
4. **Monitoring**: Consider setting up monitoring tools (Prometheus, Grafana, etc.)
5. **Security**: Keep Docker, OS, and all packages updated

---

## 📞 Support

If you encounter issues during deployment, check:
1. Docker logs: `docker-compose logs -f`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. System logs: `sudo journalctl -xe`

---

**Last Updated:** 2025-01-22
**Version:** 1.0.0
