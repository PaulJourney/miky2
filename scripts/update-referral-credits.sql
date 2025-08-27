-- ============================================
-- UPDATE REFERRAL CREDITS SYSTEM - MIKY.AI
-- Give 200 credits to referred users, 100 to non-referred
-- ============================================

-- Update the handle_new_user trigger function
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

        -- Determine initial credits based on referral
        IF referrer_code IS NOT NULL AND referrer_code != '' THEN
            initial_credits := 200; -- Bonus credits for referred users
        ELSE
            initial_credits := 100; -- Standard credits for direct signups
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
            initial_credits, -- Use calculated credits
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
                'initial_credits', initial_credits,
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

-- Update the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Log the update
INSERT INTO admin_notifications (
    user_id,
    email,
    full_name,
    notification_type,
    metadata
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- System notification
    'system@miky.ai',
    'System Update',
    'trigger_update',
    jsonb_build_object(
        'update_type', 'referral_credits',
        'description', 'Updated trigger to give 200 credits for referred users',
        'timestamp', NOW()
    )
);

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- To verify the trigger was updated:
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- END OF SCRIPT
-- ============================================
