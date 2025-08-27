-- ============================================
-- SAFE CONSERVATIVE TRIGGER FIX - MIKY.AI
-- Date: 27 Agosto 2025
-- Approach: ZERO RISK - Only update the trigger function
-- ============================================

-- STEP 1: Check current admin_notifications structure (for debugging)
-- Run this first to see what columns exist:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'admin_notifications' ORDER BY ordinal_position;

-- STEP 2: Safe trigger function update (conservativo al 100%)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    ref_code TEXT;
    referred_by_code TEXT;
    user_full_name TEXT;
BEGIN
    -- Generate unique referral code (come prima)
    ref_code := UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8));

    -- NOVITÀ: Extract metadata from auth.users
    referred_by_code := NEW.raw_user_meta_data->>'referred_by';
    user_full_name := NEW.raw_user_meta_data->>'full_name';

    -- Log for debugging (safe - solo nei logs)
    RAISE LOG 'Creating profile for user: %, email: %, referred_by: %, full_name: %',
        NEW.id, NEW.email, referred_by_code, user_full_name;

    -- AGGIORNAMENTO CONSERVATIVO: Insert profile con tutti i dati
    INSERT INTO public.profiles (
        id,
        email,
        referral_code,
        referred_by,     -- QUESTO è il fix principale!
        full_name,       -- Bonus: salva anche il nome
        credits          -- Mantiene 100 come prima
    )
    VALUES (
        NEW.id,
        NEW.email,
        ref_code,
        referred_by_code,  -- Ora viene letto dai metadati!
        user_full_name,    -- Ora viene letto dai metadati!
        100                -- Crediti base invariati
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Update trigger (sicuro - ricrea solo il trigger)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Verify trigger was updated (safe check)
SELECT
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- RESULT:
-- - Trigger now reads referred_by from metadata ✅
-- - No existing data touched ✅
-- - No table structure changes ✅
-- - 100% backward compatible ✅
-- ============================================
