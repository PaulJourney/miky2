# Miky.ai - AI-Powered Multilingual Chat Platform

[![Version](https://img.shields.io/badge/version-147-blue.svg)](https://github.com/PaulJourney/miky2)
[![Production Ready](https://img.shields.io/badge/production-ready-green.svg)](https://github.com/PaulJourney/miky2)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

> **🚀 Production-Ready AI Chat Platform** - Version 147 with 98/100 production score

Miky.ai is a modern, multilingual AI-powered chat platform built with Next.js 15, featuring real-time conversations, user authentication, subscription management, and a comprehensive referral system.

## ✨ Features

### 🤖 AI Chat System
- **OpenAI Integration** - Powered by GPT models for intelligent conversations
- **Real-time Messaging** - Instant chat with streamed responses
- **Conversation Management** - Save, load, and organize chat history
- **File Upload Support** - Share documents and images with AI

### 🌍 Multilingual Support
- **3 Languages** - English, Italian, Spanish
- **next-intl Integration** - Complete internationalization
- **Locale-aware Routing** - Automatic language detection and routing
- **Dynamic Content** - All UI elements translated

### 🔐 User Authentication
- **Supabase Auth** - Secure user registration and login
- **Email Verification** - Account verification system
- **Password Reset** - Secure password recovery
- **User Profiles** - Customizable user accounts

### 💳 Subscription System
- **Stripe Integration** - Secure payment processing
- **Multiple Plans** - Free and premium tiers
- **Subscription Management** - Easy upgrade/downgrade
- **Payment Webhooks** - Automated billing events

### 🔗 Referral Program
- **Multi-level Referrals** - Earn from referrals and sub-referrals
- **Real-time Tracking** - Monitor referral performance
- **Withdrawal System** - Request earnings withdrawals
- **Network Dashboard** - Comprehensive referral analytics

### 📊 Admin Dashboard
- **User Management** - View and manage all users
- **Analytics** - Comprehensive platform statistics
- **Conversation Monitoring** - Overview of chat activity
- **Revenue Tracking** - Subscription and referral metrics

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern component library
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icons

### Backend & Services
- **Supabase** - Database and authentication
- **OpenAI API** - AI chat functionality
- **Stripe** - Payment processing
- **SendGrid** - Email notifications
- **Vercel** - Deployment platform

### Development Tools
- **Biome** - Fast linting and formatting
- **ESLint** - Code quality enforcement
- **Bun** - Fast package manager and runtime

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Git
- Supabase account
- OpenAI API key
- Stripe account (optional)
- SendGrid account (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PaulJourney/miky2.git
   cd miky2
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables in `.env.local`:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key

   # SendGrid Configuration (optional)
   SENDGRID_API_KEY=your_sendgrid_api_key
   SMTP_FROM=your_from_email

   # Stripe Configuration (optional)
   STRIPE_SECRET_KEY=your_stripe_secret_key

   # App Configuration
   NEXT_PUBLIC_APP_NAME=Miky
   APP_BASE_URL=https://your-domain.com
   ```

4. **Set up the database**
   ```bash
   # Import the Supabase schema
   # Run the contents of supabase-schema.sql in your Supabase SQL editor
   ```

5. **Run the development server**
   ```bash
   bun run dev
   ```

6. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase service role key |
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `SENDGRID_API_KEY` | ❌ | SendGrid API for emails |
| `SMTP_FROM` | ❌ | From email address |
| `STRIPE_SECRET_KEY` | ❌ | Stripe secret key for payments |
| `NEXT_PUBLIC_APP_NAME` | ❌ | Application name |
| `APP_BASE_URL` | ❌ | Base URL for the application |

## 🏗️ Project Structure

```
miky-ai/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── [locale]/       # Internationalized routes
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   └── dashboard/      # User dashboard
│   ├── components/         # React components
│   │   ├── ui/            # Base UI components
│   │   └── dashboard/     # Dashboard-specific components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   └── i18n/              # Internationalization
├── messages/              # Translation files
├── public/                # Static assets
├── scripts/               # Build and deployment scripts
└── supabase-schema.sql    # Database schema
```

## 🌐 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   - Import your GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard
   - Deploy automatically on push to main branch

2. **Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - Ensure `APP_BASE_URL` matches your Vercel domain

3. **Database Setup**
   - Import `supabase-schema.sql` to your Supabase project
   - Configure RLS policies for security

### Manual Deployment

```bash
# Build the application
bun run build

# Start production server
bun run start
```

## 🧪 Development

### Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run linting and type checking
- `bun run format` - Format code with Biome
- `bun run pre-deploy` - Run pre-deployment checks

### Code Quality

- **TypeScript** for type safety
- **ESLint** for code quality
- **Biome** for fast formatting
- **Strict mode** enabled for production builds

## 📊 Production Status

- ✅ **Version 147** - Latest stable release
- ✅ **98/100 Score** - Production readiness audit
- ✅ **All Critical Fixes** - Applied and tested
- ✅ **Performance Optimized** - Fast loading and interactions
- ✅ **Security Hardened** - Authentication and data protection
- ✅ **Internationalization** - Complete multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**Built with ❤️ using Next.js 15 and modern web technologies**
