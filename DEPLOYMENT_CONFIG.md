# 🚀 Restaurant Admin Dashboard - Deployment Configuration

## 📋 Environment Variables Setup

Create a `.env` file in your project root with the following variables:

### 🔧 Essential Configuration

```bash
# ===========================================
# APPLICATION CONFIGURATION
# ===========================================
VITE_APP_ENV=production
VITE_APP_NAME=Restaurant Admin Dashboard
VITE_APP_VERSION=1.0.0
VITE_APP_URL=https://your-domain.com

# ===========================================
# BACKEND API CONFIGURATION
# ===========================================
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_API_TIMEOUT=30000

# ===========================================
# SUPABASE CONFIGURATION
# ===========================================
VITE_SUPABASE_URL=https://italcjeomaybmbabgmmq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0YWxjamVvbWF5Ym1iYWJnbW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTM1ODksImV4cCI6MjA3MjUyOTU4OX0.zhXcBoVHJPDU0ctXfij6cqviADJ5ZO7ByrupzCWoDYA

# ===========================================
# PAYMONGO CONFIGURATION
# ===========================================
VITE_PAYMONGO_PUBLIC_KEY=pk_test_your_paymongo_public_key_here
VITE_PAYMONGO_ENVIRONMENT=test

# ===========================================
# RESTAURANT CONFIGURATION
# ===========================================
VITE_RESTAURANT_NAME=Your Restaurant Name
VITE_RESTAURANT_ADDRESS=Your Restaurant Address
VITE_RESTAURANT_PHONE=+1-234-567-8900
VITE_RESTAURANT_EMAIL=info@your-restaurant.com
VITE_CURRENCY=PHP
VITE_CURRENCY_SYMBOL=₱
VITE_TIMEZONE=Asia/Manila

# ===========================================
# SECURITY CONFIGURATION
# ===========================================
VITE_SESSION_TIMEOUT=480
VITE_REMEMBER_ME_DURATION=30
VITE_CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# ===========================================
# FEATURE FLAGS
# ===========================================
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_PAYMONGO=true
VITE_ENABLE_SUPABASE=true
VITE_ENABLE_DEBUG_MODE=false
```

## 🔐 Secret Variables (Backend Only)

These should be set in your backend server environment:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# JWT
JWT_SECRET=your_jwt_secret_here

# PayMongo (Backend)
PAYMONGO_SECRET_KEY=sk_test_your_paymongo_secret_key_here
PAYMONGO_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase (Backend)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com
```

## 🛠️ Deployment Steps

### 1. **Frontend Deployment (Vercel/Netlify)**

1. **Create `.env` file** with the variables above
2. **Build the project**:
   ```bash
   npm run build
   ```
3. **Deploy to your platform**:
   - **Vercel**: Connect your GitHub repo
   - **Netlify**: Drag & drop the `dist` folder
   - **AWS S3**: Upload `dist` contents to S3 bucket

### 2. **Backend Deployment**

1. **Set environment variables** in your hosting platform
2. **Deploy your backend API** to:
   - **Railway**: Easy Node.js deployment
   - **Heroku**: Traditional PaaS
   - **AWS EC2**: Full control
   - **DigitalOcean**: VPS deployment

### 3. **Database Setup**

1. **Supabase**: Already configured
2. **PostgreSQL**: Set up if using custom database
3. **Backup strategy**: Enable automatic backups

## 🌐 Domain Configuration

### 1. **Custom Domain Setup**

```bash
# Update these in your .env file
VITE_APP_URL=https://admin.your-restaurant.com
VITE_API_BASE_URL=https://api.your-restaurant.com/api
VITE_CORS_ORIGINS=https://admin.your-restaurant.com,https://www.your-restaurant.com
```

### 2. **SSL Certificate**

- **Vercel/Netlify**: Automatic SSL
- **Custom hosting**: Use Let's Encrypt or Cloudflare

## 🔧 Platform-Specific Configuration

### **Vercel Deployment**

1. **Create `vercel.json`**:
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

2. **Environment Variables**: Set in Vercel dashboard

### **Netlify Deployment**

1. **Create `netlify.toml`**:
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Environment Variables**: Set in Netlify dashboard

### **AWS S3 + CloudFront**

1. **Upload to S3**: Upload `dist` contents
2. **Configure CloudFront**: Set up CDN
3. **Custom domain**: Point to CloudFront distribution

## 📱 Mobile App Configuration

If deploying as PWA:

```bash
# PWA Configuration
VITE_ENABLE_SERVICE_WORKER=true
VITE_CACHE_DURATION=3600
VITE_OFFLINE_MODE=true
```

## 🔍 Monitoring & Analytics

### **Error Tracking**
```bash
# Sentry (Optional)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### **Analytics**
```bash
# Google Analytics (Optional)
VITE_GA_TRACKING_ID=GA-XXXXXXXXX
```

## 🚨 Security Checklist

- [ ] All secret keys are in backend environment variables
- [ ] CORS origins are properly configured
- [ ] SSL certificate is installed
- [ ] API endpoints are secured
- [ ] Database credentials are protected
- [ ] PayMongo webhook secrets are set
- [ ] JWT secrets are strong and unique

## 📊 Performance Optimization

### **Build Optimization**
```bash
# Enable gzip compression
VITE_ENABLE_GZIP=true

# Disable source maps in production
VITE_SOURCE_MAPS=false

# Enable service worker caching
VITE_ENABLE_SERVICE_WORKER=true
```

### **CDN Configuration**
- Use Cloudflare or AWS CloudFront
- Enable caching for static assets
- Configure proper cache headers

## 🔄 CI/CD Pipeline

### **GitHub Actions Example**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run deploy
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## 📞 Support & Troubleshooting

### **Common Issues**

1. **CORS Errors**: Check `VITE_CORS_ORIGINS`
2. **API Connection**: Verify `VITE_API_BASE_URL`
3. **PayMongo Issues**: Check API keys and environment
4. **Supabase Errors**: Verify URL and keys

### **Debug Mode**
```bash
# Enable debug mode for troubleshooting
VITE_ENABLE_DEBUG_MODE=true
VITE_ENABLE_CONSOLE_LOGS=true
```

## 📝 Post-Deployment Checklist

- [ ] Test all authentication flows
- [ ] Verify PayMongo payments work
- [ ] Check Supabase connections
- [ ] Test offline functionality
- [ ] Verify responsive design
- [ ] Check performance metrics
- [ ] Monitor error logs
- [ ] Test backup systems

---

## 🎯 Quick Start Commands

```bash
# 1. Create .env file
cp .env.example .env

# 2. Update .env with your values
# 3. Install dependencies
npm install

# 4. Build for production
npm run build

# 5. Preview build
npm run preview

# 6. Deploy to your platform
```

Your Restaurant Admin Dashboard is now ready for deployment! 🚀
