# 📝 .env.local Configuration Reminder

## ⚠️ IMPORTANTE
Il file `.env.local` contiene le chiavi segrete e NON viene sincronizzato su GitHub per sicurezza.

## 🔑 Variabili richieste in .env.local:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App Config
NEXT_PUBLIC_APP_NAME=Miky
APP_BASE_URL=https://miky.ai

# Email (opzionale)
SENDGRID_API_KEY=your_sendgrid_key
SMTP_FROM=noreply@miky.ai

# Stripe (opzionale)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## ✅ STATUS
- File `.env.local` copiato da miky-ai → miky2
- Data: 26 Agosto 2025
- Protetto da .gitignore ✅

## 🔄 Se perdi il file:
1. Copia da miky-ai: `cp miky-ai/.env.local miky2/.env.local`
2. O recupera le chiavi dal tuo account Supabase/OpenAI
