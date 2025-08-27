import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter required' },
      { status: 400 }
    )
  }

  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'User not found in profiles', details: profileError.message },
        { status: 404 }
      )
    }

    // Get auth user details
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authUsers?.users?.find(u => u.email === email.toLowerCase())

    // Get admin notifications for this user
    const { data: notifications, error: notifError } = await supabaseAdmin
      .from('admin_notifications')
      .select('*')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })

    // Check if referral code exists and is valid
    let referrerInfo = null
    if (profile.referred_by) {
      const { data: referrer, error: referrerError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, referral_code')
        .eq('referral_code', profile.referred_by)
        .single()

      if (!referrerError && referrer) {
        referrerInfo = referrer
      }
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        credits: profile.credits,
        referred_by: profile.referred_by,
        referral_code: profile.referral_code,
        created_at: profile.created_at
      },
      authUser: authUser ? {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        user_metadata: authUser.user_metadata
      } : null,
      referrerInfo,
      registrationLogs: notifications || [],
      analysis: {
        hasReferralCode: !!profile.referred_by,
        referralCodeValid: !!referrerInfo,
        currentCredits: profile.credits,
        expectedCredits: profile.referred_by ? 200 : 100,
        needsCorrection: profile.referred_by && profile.credits === 100,
        registrationMetadata: authUser?.user_metadata || null
      }
    })

  } catch (error) {
    console.error('Error debugging user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
