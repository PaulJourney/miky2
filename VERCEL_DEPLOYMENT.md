# Vercel Deployment Guide for Miky.ai

## 🚀 Quick Deployment

### Step 1: Connect Repository to Vercel

1. **Visit Vercel Dashboard**
   - Go to [https://vercel.com/jimmywhite](https://vercel.com/jimmywhite)
   - Sign in to your account

2. **Import Project**
   - Click "New Project"
   - Select "Import Git Repository"
   - Connect to GitHub and select `PaulJourney/miky2`
   - Click "Import"

### Step 2: Configure Build Settings

Vercel will automatically detect Next.js. Confirm these settings:

- **Framework Preset**: Next.js
- **Build Command**: `bun run build`
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `bun install`
- **Development Command**: `bun run dev`

### Step 3: Environment Variables

Add these environment variables in Vercel Dashboard > Settings > Environment Variables:

#### ✅ Required Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# App Configuration
NEXT_PUBLIC_APP_NAME=Miky
APP_BASE_URL=https://your-vercel-app.vercel.app
```

#### 🔧 Optional Variables (for full functionality)

```env
# SendGrid Configuration (for emails)
SENDGRID_API_KEY=your_sendgrid_api_key
SMTP_FROM=noreply@your-domain.com

# Stripe Configuration (for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Step 4: Database Setup

1. **Import Supabase Schema**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and execute the contents of `supabase-schema.sql`

2. **Configure RLS Policies**
   - The schema includes Row Level Security policies
   - Verify they're properly applied in Supabase Auth

### Step 5: Deploy

1. **Initial Deployment**
   - Click "Deploy" in Vercel
   - Wait for build to complete (typically 2-3 minutes)

2. **Verify Deployment**
   - Visit your Vercel URL
   - Test user registration and login
   - Verify chat functionality works

## 🔧 Advanced Configuration

### Custom Domain (Optional)

1. **Add Domain in Vercel**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables**
   ```env
   APP_BASE_URL=https://your-custom-domain.com
   ```

### Production Optimizations

The application is already optimized with:

- ✅ **Image Optimization**: Next.js Image component with optimization
- ✅ **Bundle Analysis**: Optimized imports and code splitting
- ✅ **Caching**: Proper HTTP caching headers
- ✅ **SEO**: Meta tags and sitemap generation
- ✅ **Performance**: Lazy loading and component optimization

### Security Headers

The `vercel.json` configuration includes:

- Content Security Policy headers
- XSS Protection
- Frame Options (DENY)
- CORS configuration for API routes

## 🐛 Troubleshooting

### Build Errors

1. **TypeScript Errors**
   ```bash
   # Check locally first
   bun run lint
   ```

2. **Missing Dependencies**
   - Ensure all required environment variables are set
   - Check Vercel build logs for specific errors

3. **Database Connection Issues**
   - Verify Supabase URL and keys are correct
   - Check if Supabase project is active

### Runtime Errors

1. **Authentication Issues**
   - Verify Supabase configuration
   - Check if email confirmation is required

2. **OpenAI API Errors**
   - Verify API key is valid
   - Check rate limits and billing

3. **Stripe Integration**
   - Ensure webhook endpoints are configured
   - Verify test/live mode consistency

## 📊 Monitoring & Analytics

### Vercel Analytics

1. **Enable Analytics**
   - Go to Project Settings > Analytics
   - Enable Vercel Analytics for performance monitoring

2. **Function Logs**
   - Monitor API route performance
   - Check serverless function execution times

### Supabase Monitoring

1. **Database Performance**
   - Monitor query performance in Supabase Dashboard
   - Set up database usage alerts

2. **Auth Metrics**
   - Track user registration and login rates
   - Monitor authentication success/failure rates

## 🔄 Continuous Deployment

### Automatic Deployments

- **Main Branch**: Automatically deploys to production
- **Preview Deployments**: Created for all pull requests
- **Build Previews**: Available for testing before merge

### Manual Deployment

```bash
# From local environment
git push origin main

# This will trigger automatic deployment to Vercel
```

## 📝 Post-Deployment Checklist

- [ ] Application loads successfully
- [ ] User registration/login works
- [ ] Chat functionality operational
- [ ] Email notifications working (if configured)
- [ ] Payment processing functional (if configured)
- [ ] All three languages (EN, IT, ES) accessible
- [ ] Mobile responsiveness verified
- [ ] Performance metrics acceptable
- [ ] Error monitoring configured

## 🆘 Support

For deployment issues:

1. **Check Vercel Build Logs**
   - Detailed error messages in deployment logs
   - Function execution logs for runtime errors

2. **Local Testing**
   ```bash
   bun run build
   bun run start
   ```

3. **GitHub Issues**
   - Report deployment-specific issues
   - Include Vercel deployment URL and error logs

---

**🎉 Your Miky.ai application is now ready for production deployment on Vercel!**
