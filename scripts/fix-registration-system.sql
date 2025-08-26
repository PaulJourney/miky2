-- ============================================
-- FIX REGISTRATION SYSTEM - MIKY.AI
-- Date: 26 Agosto 2025
-- Version: 2.0 - Complete Fix
-- ============================================

-- 1. Add missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE;

-- 2. Drop conflicting policies first (safe in development)
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- 3. Create comprehensive RLS Policies for profiles table
-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service role to manage all profiles (for trigger and admin operations)
CREATE POLICY "Service role can manage profiles"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Create admin_notifications table for tracking
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    notification_type TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for admin_notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage admin_notifications
CREATE POLICY "Service role can manage admin notifications"
ON admin_notifications FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Update the trigger function to handle profile creation better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    ref_code TEXT;
    referrer_code TEXT;
    profile_exists BOOLEAN;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO profile_exists;

    -- Only create profile if it doesn't exist
    IF NOT profile_exists THEN
        -- Generate unique referral code
        ref_code := UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8));

        -- Extract referral code from metadata if exists
        referrer_code := NEW.raw_user_meta_data->>'referred_by';

        -- Insert profile with all necessary fields
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
            100, -- Starting credits
            0,   -- Starting water cleaned
            'free',
            false,
            NOW(),
            NOW(),
            false -- Email not verified initially
        ) ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors

        -- Log admin notification (for tracking)
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
                'initial_credits', 100,
                'registration_source', COALESCE(NEW.raw_user_meta_data->>'source', 'direct')
            )
        );

        -- If referred by someone, update referrer's credits and water cleaned
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

-- 6. Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);

-- 8. Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;

-- 9. Add missing columns if they don't exist
DO $$
BEGIN
    -- Add total_referrals column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_referrals') THEN
        ALTER TABLE profiles ADD COLUMN total_referrals INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES - Run these to check
-- ============================================

-- Check if columns were added:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- AND column_name IN ('email_verified', 'verification_token', 'verification_token_expires');

-- Check RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check trigger:
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- Check admin_notifications table:
-- SELECT * FROM information_schema.tables WHERE table_name = 'admin_notifications';

-- ============================================
-- ROLLBACK COMMANDS (if needed)
-- ============================================

-- To rollback column additions:
-- ALTER TABLE profiles
-- DROP COLUMN IF EXISTS email_verified,
-- DROP COLUMN IF EXISTS verification_token,
-- DROP COLUMN IF EXISTS verification_token_expires;

-- To rollback table creation:
-- DROP TABLE IF EXISTS admin_notifications;

-- ============================================
-- END OF SCRIPT
-- ============================================
