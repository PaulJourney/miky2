-- ============================================
-- FIX EMAIL VERIFICATION SYSTEM
-- ============================================

-- 1. Aggiungi campi mancanti alla tabella profiles (se non esistono)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE;

-- 2. CRITICAL: Aggiungi policy INSERT mancante (causa errore 403)
CREATE POLICY IF NOT EXISTS "Service role can insert profiles"
ON profiles FOR INSERT
TO service_role
USING (true)
WITH CHECK (true);

-- Permetti agli utenti di inserire il proprio profilo
CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Aggiorna il trigger per gestire meglio la creazione profili
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    ref_code TEXT;
    referrer_code TEXT;
BEGIN
    -- Genera codice referral univoco
    ref_code := UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8));

    -- Estrai referral code dai metadata se esiste
    referrer_code := NEW.raw_user_meta_data->>'referred_by';

    -- Crea profilo con tutti i campi necessari
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        referral_code,
        referred_by,
        credits,
        water_cleaned_liters,
        subscription_plan,
        subscription_status,
        email_verified,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        ref_code,
        referrer_code,
        100,
        0,
        'free',
        'active',
        false, -- Email non verificata inizialmente
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ricrea il trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_profiles_verification_token ON profiles(verification_token);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);

-- VERIFICA:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- AND column_name IN ('email_verified', 'verification_token', 'verification_token_expires');
