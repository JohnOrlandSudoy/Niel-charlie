# 🚀 Vercel Deployment Guide - Restaurant Admin Dashboard

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm i -g vercel`
3. **GitHub Account**: For automatic deployments
4. **Environment Variables**: Your API keys and configuration

## 🔧 Step-by-Step Deployment

### 1. **Prepare Your Environment Variables**

Create a `.env` file in your project root with these essential variables:

```bash
# ===========================================
# ESSENTIAL CONFIGURATION FOR VERCEL
# ===========================================

# Application Configuration
VITE_APP_ENV=production
VITE_APP_NAME=Restaurant Admin Dashboard
VITE_APP_URL=https://your-app-name.vercel.app

# Backend API Configuration
VITE_API_BASE_URL=https://your-backend-api.com/api

# Supabase Configuration
VITE_SUPABASE_URL=https://italcjeomaybmbabgmmq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0YWxjamVvbWF5Ym1iYWJnbW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTM1ODksImV4cCI6MjA3MjUyOTU4OX0.zhXcBoVHJPDU0ctXfij6cqviADJ5ZO7ByrupzCWoDYA

# PayMongo Configuration
VITE_PAYMONGO_PUBLIC_KEY=pk_test_your_paymongo_public_key_here
VITE_PAYMONGO_ENVIRONMENT=test

# Restaurant Configuration
VITE_RESTAURANT_NAME=Your Restaurant Name
VITE_RESTAURANT_ADDRESS=Your Restaurant Address
VITE_RESTAURANT_PHONE=+1-234-567-8900
VITE_RESTAURANT_EMAIL=info@your-restaurant.com
VITE_CURRENCY=PHP
VITE_CURRENCY_SYMBOL=₱
VITE_TIMEZONE=Asia/Manila

# Security Configuration
VITE_SESSION_TIMEOUT=480
VITE_REMEMBER_ME_DURATION=30
VITE_CORS_ORIGINS=https://your-app-name.vercel.app

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_PAYMONGO=true
VITE_ENABLE_SUPABASE=true
VITE_ENABLE_DEBUG_MODE=false
```

### 2. **Install Vercel CLI**

```bash
npm install -g vercel
```

### 3. **Login to Vercel**

```bash
vercel login
```

### 4. **Deploy Your Project**

#### Option A: Deploy via CLI (Recommended)

```bash
# Navigate to your project directory
cd /path/to/your/restaurant-admin-dashboard

# Deploy to Vercel
vercel

# For production deployment
vercel --prod
```

#### Option B: Deploy via GitHub Integration

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy!

### 5. **Configure Environment Variables in Vercel**

1. Go to your project dashboard on Vercel
2. Click on "Settings" → "Environment Variables"
3. Add all your environment variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_APP_ENV` | `production` | Production, Preview, Development |
| `VITE_API_BASE_URL` | `https://your-api.com/api` | Production, Preview, Development |
| `VITE_SUPABASE_URL` | `https://italcjeomaybmbabgmmq.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `VITE_PAYMONGO_PUBLIC_KEY` | `pk_test_...` | Production, Preview, Development |
| `VITE_RESTAURANT_NAME` | `Your Restaurant Name` | Production, Preview, Development |

### 6. **Custom Domain Setup (Optional)**

1. In Vercel dashboard, go to "Settings" → "Domains"
2. Add your custom domain
3. Update your environment variables:
   ```bash
   VITE_APP_URL=https://admin.your-restaurant.com
   VITE_CORS_ORIGINS=https://admin.your-restaurant.com,https://www.your-restaurant.com
   ```

## 🛠️ Vercel Configuration Files

Your project already includes these Vercel configuration files:

### `vercel.json`
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
  ],
  "env": {
    "VITE_APP_ENV": "production"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## 🚀 Quick Deployment Commands

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Deploy to Vercel
npm run deploy

# Or use the deployment script
./deploy.sh vercel
```

## 🔍 Post-Deployment Checklist

- [ ] ✅ Application loads correctly
- [ ] ✅ Authentication works
- [ ] ✅ API connections are working
- [ ] ✅ PayMongo payments function
- [ ] ✅ Supabase integration works
- [ ] ✅ Responsive design works on mobile
- [ ] ✅ All features are accessible
- [ ] ✅ Performance is optimal
- [ ] ✅ SSL certificate is active
- [ ] ✅ Custom domain is working (if applicable)

## 🐛 Troubleshooting

### Common Issues:

1. **Build Failures**:
   ```bash
   # Check build locally
   npm run build
   
   # Check for TypeScript errors
   npx tsc --noEmit
   ```

2. **Environment Variables Not Working**:
   - Ensure all variables start with `VITE_`
   - Check Vercel dashboard for correct values
   - Redeploy after adding new variables

3. **API Connection Issues**:
   - Verify `VITE_API_BASE_URL` is correct
   - Check CORS settings on your backend
   - Ensure backend is deployed and accessible

4. **PayMongo Issues**:
   - Verify `VITE_PAYMONGO_PUBLIC_KEY` is correct
   - Check PayMongo environment (test/live)
   - Ensure webhook URLs are updated

### Debug Mode:

Enable debug mode in your environment variables:
```bash
VITE_ENABLE_DEBUG_MODE=true
VITE_ENABLE_CONSOLE_LOGS=true
```

## 📊 Performance Optimization

### Vercel Analytics:
1. Enable Vercel Analytics in your dashboard
2. Monitor Core Web Vitals
3. Optimize based on performance data

### Build Optimization:
- Your `vite.config.ts` is already optimized
- Code splitting is configured
- Assets are properly cached

## 🔄 Continuous Deployment

With GitHub integration:
1. Push to `main` branch → Production deployment
2. Push to other branches → Preview deployment
3. Pull requests → Preview deployment with comments

## 📱 PWA Configuration

Your app is already configured as a PWA:
- Service worker enabled
- Offline functionality
- App manifest configured

## 🎯 Next Steps After Deployment

1. **Test Everything**: Thoroughly test all features
2. **Monitor Performance**: Use Vercel Analytics
3. **Set Up Monitoring**: Consider Sentry for error tracking
4. **Backup Strategy**: Ensure your backend has backups
5. **Security Review**: Review all environment variables
6. **Documentation**: Update your team on the new URLs

## 🆘 Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Vercel Support**: Available in your dashboard

---

## 🎉 You're Ready to Deploy!

Your Restaurant Admin Dashboard is now configured for Vercel deployment. Follow the steps above and you'll have your app live in minutes!

**Quick Start:**
```bash
npm install -g vercel
vercel login
vercel --prod
```

Happy deploying! 🚀
