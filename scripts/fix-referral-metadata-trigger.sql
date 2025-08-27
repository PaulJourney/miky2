-- ============================================
-- FIX REFERRAL METADATA TRIGGER - MIKY.AI
-- Date: 27 Agosto 2025
-- Issue: Trigger non legge i metadati referred_by
-- ============================================

-- Fix the handle_new_user function to read user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    ref_code TEXT;
    referred_by_code TEXT;
    user_full_name TEXT;
BEGIN
    -- Generate unique referral code
    ref_code := UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8));

    -- Extract metadata from auth.users
    referred_by_code := NEW.raw_user_meta_data->>'referred_by';
    user_full_name := NEW.raw_user_meta_data->>'full_name';

    -- Log for debugging
    RAISE LOG 'Creating profile for user: %, email: %, referred_by: %, full_name: %',
        NEW.id, NEW.email, referred_by_code, user_full_name;

    -- Insert profile with all metadata
    INSERT INTO public.profiles (
        id,
        email,
        referral_code,
        referred_by,
        full_name,
        credits
    )
    VALUES (
        NEW.id,
        NEW.email,
        ref_code,
        referred_by_code,  -- Questo ora viene letto dai metadati!
        user_full_name,    -- Anche il nome viene salvato
        100                -- Crediti base per tutti
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger (ricrea se esiste già)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Log successful update
INSERT INTO public.admin_notifications (
    type,
    title,
    content,
    created_at
) VALUES (
    'system_update',
    'Trigger Fixed - Referral Metadata',
    'Updated handle_new_user trigger to properly read referred_by and full_name from user metadata',
    NOW()
);

-- Query to verify the fix worked:
-- SELECT
--     id, email, full_name, referred_by, referral_code, credits, created_at
-- FROM profiles
-- WHERE created_at > NOW() - INTERVAL '1 hour'
-- ORDER BY created_at DESC;
