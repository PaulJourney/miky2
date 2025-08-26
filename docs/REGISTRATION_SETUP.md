# 📝 Guida Configurazione Sistema di Registrazione - Miky.ai

## 🔧 Configurazione Necessaria

### 1. Variabili d'Ambiente

Aggiungi queste variabili al tuo file `.env.local`:

```bash
# SendGrid (per invio email)
SENDGRID_API_KEY=your_sendgrid_api_key_here
SMTP_FROM=noreply@miky.ai

# Supabase Service Key (per operazioni admin)
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# App Configuration
APP_BASE_URL=https://www.miky.ai
```

### 2. Database Setup - Esegui SQL in Supabase

Vai su Supabase Dashboard → SQL Editor e esegui questo script:

```sql
-- ============================================
-- FIX REGISTRATION SYSTEM - MIKY.AI
-- ============================================

-- 1. Add missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE;

-- 2. Fix RLS Policies for profiles table
-- Allow users to insert their own profile
CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow service role to manage profiles
CREATE POLICY IF NOT EXISTS "Service role can manage profiles"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT NOT NULL,
    user_name TEXT,
    notification_type TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- 4. Enable RLS on admin_notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for service role
CREATE POLICY "Service role can manage notifications"
ON admin_notifications FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### 3. SendGrid Configuration

1. **Crea un account SendGrid**: https://sendgrid.com/
2. **Genera API Key**:
   - Dashboard → Settings → API Keys
   - Click "Create API Key"
   - Nome: "Miky.ai Production"
   - Permessi: "Full Access"
   - Salva la key nel `.env.local`

3. **Verifica il dominio mittente**:
   - Settings → Sender Authentication
   - Aggiungi dominio: miky.ai
   - Segui le istruzioni DNS

### 4. Test del Sistema

#### Test 1: Registrazione Base
1. Apri la tua app in locale
2. Click su "Get Started"
3. Compila il form di registrazione
4. Verifica nella console:
   - Nessun errore 403/406/500
   - Log: "Verification email sent to..."
   - Log: "Admin notification sent..."

#### Test 2: Verifica Database
```sql
-- Controlla se il profilo è stato creato
SELECT * FROM profiles
WHERE email = 'test@example.com';

-- Controlla le notifiche admin
SELECT * FROM admin_notifications
ORDER BY sent_at DESC;
```

#### Test 3: Email (con SendGrid configurato)
- Controlla inbox dell'utente per email di conferma
- Controlla support@miky.ai per notifica admin

## 🚨 Troubleshooting

### Errore 403 Forbidden
**Causa**: Mancano le RLS policies
**Soluzione**: Esegui lo script SQL sopra

### Errore 406 Not Acceptable
**Causa**: Colonne mancanti nella tabella profiles
**Soluzione**: Esegui ALTER TABLE per aggiungere le colonne

### Email non inviate
**Causa**: SendGrid non configurato
**Soluzione**:
1. Verifica SENDGRID_API_KEY nel .env.local
2. Controlla che il dominio sia verificato
3. Verifica i log nella console

### Profilo non creato
**Causa**: Trigger database non funziona
**Soluzione**: Verifica che il trigger `handle_new_user` sia attivo

## 📊 Monitoring

### Metriche da monitorare:
- Registrazioni completate con successo
- Email di conferma inviate
- Notifiche admin inviate
- Errori di registrazione

### Log importanti:
```javascript
// In caso di successo dovresti vedere:
"Verification email sent to user@example.com"
"Admin notification sent for new user: user@example.com"

// In caso di errore (ma registrazione completata):
"SendGrid not configured - skipping confirmation email"
"Email sending failed but registration successful"
```

## ✅ Checklist Pre-Produzione

- [ ] Script SQL eseguito in Supabase
- [ ] SendGrid API key configurata
- [ ] Dominio verificato in SendGrid
- [ ] Test registrazione completato
- [ ] Email di conferma ricevuta
- [ ] Notifica admin ricevuta
- [ ] Nessun errore 403/406/500 in console
- [ ] Profilo creato correttamente nel DB

## 🔐 Sicurezza

1. **Non esporre mai**:
   - SUPABASE_SERVICE_KEY
   - SENDGRID_API_KEY

2. **Usa sempre HTTPS** in produzione

3. **Rate limiting**: Considera di aggiungere rate limiting alle API di registrazione

4. **Validazione**: Il sistema già valida:
   - Email formato corretto
   - Password minimo 6 caratteri
   - Nome completo obbligatorio

## 📧 Template Email

### Email Conferma Utente
- Soggetto: "Welcome to Miky.ai - Please verify your email"
- Include: Nome utente, link conferma, info su crediti iniziali
- Design: Responsive, dark theme

### Email Notifica Admin
- Destinatario: support@miky.ai
- Soggetto: "🆕 Nuova registrazione: [Nome Utente]"
- Include: Nome, email, user ID, data, referral code (se presente)

## 🚀 Deploy

Dopo aver configurato tutto:

1. **Commit delle modifiche**:
```bash
git add .
git commit -m "Configure registration system"
git push origin main
```

2. **Vercel Environment Variables**:
- Dashboard Vercel → Settings → Environment Variables
- Aggiungi SENDGRID_API_KEY, SMTP_FROM, SUPABASE_SERVICE_KEY

3. **Test in produzione**:
- Registra un utente di test
- Verifica email e notifiche
- Controlla database Supabase

---

📌 **Supporto**: Per problemi, contatta il team DevOps o apri un ticket su GitHub.
