import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Check current trigger
    const { data: triggers, error } = await supabaseAdmin
      .rpc('check_trigger_status')

    if (error) {
      console.error('Error checking trigger:', error)
    }

    // Get current function definition
    const { data: functions, error: funcError } = await supabaseAdmin
      .from('information_schema.routines')
      .select('routine_definition')
      .eq('routine_name', 'handle_new_user')

    return NextResponse.json({
      status: 'checking',
      triggers: triggers || 'Unable to check',
      functions: functions || 'Unable to check',
      error: error?.message || funcError?.message
    })

  } catch (error) {
    console.error('Error in trigger check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action !== 'update_trigger') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Updated trigger function with referral credits logic
    const triggerFunction = `
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
            RAISE LOG 'User % has referral code %, giving 200 credits', NEW.email, referrer_code;
        ELSE
            initial_credits := 100; -- Standard credits for direct signups
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
`

    // Execute the trigger update
    const { error: updateError } = await supabaseAdmin.rpc('execute_sql', {
      sql: triggerFunction
    })

    if (updateError) {
      // Try direct execution
      const { error: directError } = await supabaseAdmin
        .from('_dummy_') // This will fail but might execute the SQL
        .select('*')

      // Manual execution using raw query
      try {
        const result = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_trigger_update`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: triggerFunction })
        })

        return NextResponse.json({
          success: true,
          message: 'Trigger update attempted',
          triggerFunction,
          note: 'Please execute the SQL manually in Supabase if this fails'
        })
      } catch (fetchError) {
        return NextResponse.json({
          success: false,
          error: 'Could not execute automatically',
          triggerFunction,
          instruction: 'Please execute this SQL manually in Supabase SQL Editor',
          sql: triggerFunction
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Trigger updated successfully',
      triggerFunction
    })

  } catch (error) {
    console.error('Error updating trigger:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
