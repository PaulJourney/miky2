# 📋 GUIDA IMPLEMENTAZIONE FIX REGISTRAZIONE

## 🚀 STEP-BY-STEP per risolvere i problemi di registrazione

### STEP 1: Configurazione Supabase Dashboard
1. **Vai su Supabase Dashboard** → Authentication → Email Templates
2. **Disabilita temporaneamente** "Enable email confirmations" per testare
3. **Configura SMTP** (opzionale ma consigliato):
   - Settings → Auth → SMTP Settings
   - Oppure usa il servizio email di Supabase (limitato)

### STEP 2: Esegui Fix Database
```bash
# Connettiti al database Supabase ed esegui:
psql -h [your-supabase-host] -U postgres -d postgres < scripts/fix-registration-system.sql

# O tramite Supabase Dashboard:
# SQL Editor → New Query → Incolla il contenuto di fix-registration-system.sql
```

### STEP 3: Configura Variabili d'Ambiente
Aggiungi in `.env.local`:
```env
# SendGrid (per invio email)
SENDGRID_API_KEY=your_sendgrid_api_key
SMTP_FROM=noreply@miky.ai

# App URL
NEXT_PUBLIC_APP_URL=https://www.miky.ai
```

### STEP 4: Semplifica il Codice Signup
Modifica `src/lib/supabase.ts`:

```typescript
export async function signUp(email: string, password: string, fullName: string, referralCode?: string) {
  try {
    // Solo registrazione auth, il profilo viene creato dal trigger
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName,
          referred_by: referralCode || null
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    })

    if (error) {
      return { error: { message: error.message } }
    }

    // Invia notifica admin (non bloccante)
    if (data.user) {
      fetch('/api/auth/notify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          name: fullName,
          referralCode
        })
      }).catch(console.error)
    }

    return { data, error: null }
  } catch (error: any) {
    return { error: { message: error.message || 'An unexpected error occurred' } }
  }
}
```

### STEP 5: Crea API Route per Notifiche
Crea `src/app/api/auth/notify-registration/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { sendAdminNotification } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { email, name, referralCode } = await request.json()

    // Invia notifica admin (non bloccante)
    await sendAdminNotification(email, name, referralCode)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification error:', error)
    // Non fallire la registrazione per errori di notifica
    return NextResponse.json({ success: false })
  }
}
```

### STEP 6: Test della Registrazione
1. **Test senza email**: Disabilita conferma email in Supabase
2. **Verifica creazione profilo**: Controlla tabella `profiles`
3. **Verifica trigger**: Controlla i log di Supabase
4. **Test con email**: Riabilita e configura SMTP

## ⚙️ CONFIGURAZIONE SENDGRID

### 1. Crea Account SendGrid
- Vai su https://sendgrid.com
- Registrati per account gratuito (100 email/giorno)

### 2. Configura Dominio
- Settings → Sender Authentication
- Verifica dominio miky.ai
- Aggiungi record DNS richiesti

### 3. Crea API Key
- Settings → API Keys → Create API Key
- Permessi: Mail Send
- Salva la key in `.env.local`

## 🧪 TESTING CHECKLIST

### Test Registrazione Base:
- [ ] Form registrazione funziona
- [ ] Nessun errore 403/406/500
- [ ] Profilo creato in database
- [ ] Crediti iniziali assegnati (100)
- [ ] Referral code generato

### Test Email:
- [ ] Email conferma inviata (se abilitata)
- [ ] Email admin inviata a support@miky.ai
- [ ] Link conferma funziona
- [ ] Email benvenuto dopo conferma

### Test Referral:
- [ ] Referral code accettato
- [ ] Campo `referred_by` popolato
- [ ] Relazione referral creata

## 🔍 DEBUGGING

### Check Policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Check Trigger:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Check Profile Creation:
```sql
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;
```

### Check Auth Users:
```sql
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;
```

## 📝 NOTE IMPORTANTI

1. **RLS Policies**: Assicurati che le policy permettano INSERT
2. **Email Service**: SendGrid richiede verifica dominio per produzione
3. **Trigger vs Frontend**: Usa SOLO il trigger per creare profili
4. **Error Handling**: Non bloccare registrazione per errori email
5. **Testing**: Testa prima senza email, poi con email

## 🚨 TROUBLESHOOTING

### Errore 403 Forbidden:
- Problema: RLS policy mancante
- Soluzione: Esegui script SQL per aggiungere policy INSERT

### Errore "Error sending confirmation email":
- Problema: Email service non configurato
- Soluzione: Configura SendGrid o disabilita conferma email

### Profilo non creato:
- Problema: Trigger non funziona
- Soluzione: Verifica trigger e permessi service_role

### Referral non tracciato:
- Problema: Campo referred_by non salvato
- Soluzione: Verifica che il metadata venga passato correttamente
