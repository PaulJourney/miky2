import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json()

    if (!userId || !email) {
      console.error('❌ Missing userId or email in referral bonus API')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log(`🎯 Processing referral bonus for user ${email} (${userId})`)

    // 1. Get user profile with referral info (with better error handling)
    console.log(`🔍 Searching for profile with ID: ${userId}`)

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('referred_by, credits, full_name')
      .eq('id', userId)
      .maybeSingle() // Use maybeSingle() instead of single() to handle 0 results

    console.log(`📊 Query result:`, { userProfile, profileError })

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    if (!userProfile) {
      console.error(`❌ No profile found for user ID: ${userId}`)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (!userProfile.referred_by) {
      console.log(`ℹ️ User ${email} has no referral code, skipping bonus`)
      return NextResponse.json({
        success: true,
        message: 'No referral code, no bonus needed'
      })
    }

    console.log(`🔍 User ${email} was referred by: ${userProfile.referred_by}`)

    // 2. Validate referral code exists and find referrer
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, referral_code')
      .eq('referral_code', userProfile.referred_by.toUpperCase())
      .single()

    if (referrerError || !referrer) {
      console.error(`❌ Invalid referral code: ${userProfile.referred_by}`)
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 400 }
      )
    }

    console.log(`✅ Valid referrer found: ${referrer.full_name} (${referrer.id})`)

    // 3. Add 100 bonus credits to the new user
    const newCredits = userProfile.credits + 100

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Error updating user credits:', updateError)
      return NextResponse.json(
        { error: 'Failed to update credits' },
        { status: 500 }
      )
    }

    console.log(`✅ Added 100 bonus credits to ${email}. Total: ${newCredits}`)

    // 4. Log the referral activity
    try {
      await supabaseAdmin
        .from('admin_notifications')
        .insert({
          type: 'referral_bonus',
          title: 'Referral Bonus Applied',
          content: `User ${userProfile.full_name} (${email}) received 100 bonus credits for using referral code ${userProfile.referred_by} from ${referrer.full_name}`,
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.warn('⚠️ Failed to log referral activity:', logError)
      // Don't fail the main operation
    }

    return NextResponse.json({
      success: true,
      message: 'Referral bonus applied successfully',
      creditsAdded: 100,
      totalCredits: newCredits,
      referrerName: referrer.full_name
    })

  } catch (error) {
    console.error('❌ Referral bonus API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
