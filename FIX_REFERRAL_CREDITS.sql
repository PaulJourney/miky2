-- ============================================
-- 🔧 FIX REFERRAL CREDITS - ESEGUIRE IN SUPABASE
-- Questo script aggiorna il trigger per dare 200 crediti ai referral
-- ============================================

-- 1. Aggiorna la funzione handle_new_user con logica referral
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    ref_code TEXT;
    referrer_code TEXT;
    profile_exists BOOLEAN;
    initial_credits INTEGER;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO profile_exists;

    -- Only create profile if it doesn't exist
    IF NOT profile_exists THEN
        -- Generate unique referral code
        ref_code := UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8));

        -- Extract referral code from metadata if exists
        referrer_code := NEW.raw_user_meta_data->>'referred_by';

        -- 🎯 LOGICA CREDITI REFERRAL
        IF referrer_code IS NOT NULL AND referrer_code != '' THEN
            initial_credits := 200; -- ✅ 200 crediti per utenti con referral
            RAISE LOG 'User % has referral code %, giving 200 credits', NEW.email, referrer_code;
        ELSE
            initial_credits := 100; -- ✅ 100 crediti per registrazioni dirette
            RAISE LOG 'User % has no referral, giving 100 credits', NEW.email;
        END IF;

        -- Insert profile with calculated credits
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            referral_code,
            referred_by,
            credits,
            water_cleaned_liters,
            subscription_plan,
            is_verified,
            created_at,
            updated_at,
            email_verified
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            ref_code,
            referrer_code,
            initial_credits, -- 🎯 Usa i crediti calcolati
            0,
            'free',
            false,
            NOW(),
            NOW(),
            false
        ) ON CONFLICT (id) DO NOTHING;

        -- Log admin notification
        INSERT INTO public.admin_notifications (
            user_id,
            email,
            full_name,
            notification_type,
            metadata
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            'new_registration',
            jsonb_build_object(
                'referral_code', referrer_code,
                'initial_credits', initial_credits,
                'registration_source', COALESCE(NEW.raw_user_meta_data->>'source', 'direct'),
                'trigger_version', 'v2_referral_credits'
            )
        );

        -- Bonus per il referrer
        IF referrer_code IS NOT NULL THEN
            UPDATE public.profiles
            SET
                credits = credits + 50,
                water_cleaned_liters = water_cleaned_liters + 50,
                total_referrals = COALESCE(total_referrals, 0) + 1,
                updated_at = NOW()
            WHERE referral_code = referrer_code;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Aggiorna il trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Log dell'aggiornamento
INSERT INTO public.admin_notifications (
    user_id,
    email,
    full_name,
    notification_type,
    metadata
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'system@miky.ai',
    'System Update',
    'trigger_update',
    jsonb_build_object(
        'update_type', 'referral_credits_fix',
        'description', 'Updated trigger to give 200 credits for referred users',
        'timestamp', NOW(),
        'version', 'v2'
    )
);

-- ============================================
-- 🔍 QUERY DI VERIFICA
-- ============================================

-- Verifica che il trigger sia stato aggiornato:
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Controlla gli ultimi utenti registrati e i loro crediti:
SELECT
    email,
    referred_by,
    credits,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- ✅ SCRIPT COMPLETATO
-- Dopo aver eseguito questo script, i nuovi utenti
-- con referral code riceveranno 200 crediti iniziali
-- ============================================
