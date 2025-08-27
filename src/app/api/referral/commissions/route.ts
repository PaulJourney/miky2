import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Commission structure as defined in the audit
const COMMISSION_STRUCTURE = {
  plus: {
    monthlyPrice: 5.00,
    levels: [
      { level: 1, percentage: 40, amount: 2.00 },
      { level: 2, percentage: 30, amount: 1.50 },
      { level: 3, percentage: 16, amount: 0.80 },
      { level: 4, percentage: 10, amount: 0.50 },
      { level: 5, percentage: 4, amount: 0.20 }
    ]
  },
  pro: {
    monthlyPrice: 15.00,
    levels: [
      { level: 1, percentage: 40, amount: 6.00 },
      { level: 2, percentage: 27, amount: 4.05 },
      { level: 3, percentage: 16, amount: 2.40 },
      { level: 4, percentage: 9, amount: 1.35 },
      { level: 5, percentage: 8, amount: 1.20 }
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, subscriptionPlan, isNewSubscription = true } = await request.json()

    if (!userId || !subscriptionPlan) {
      return NextResponse.json(
        { error: 'User ID and subscription plan are required' },
        { status: 400 }
      )
    }

    if (!['plus', 'pro'].includes(subscriptionPlan)) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      )
    }

    // Get the subscriber's profile to find their referrer
    const { data: subscriber, error: subscriberError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, referred_by')
      .eq('id', userId)
      .single()

    if (subscriberError || !subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    // If no referrer, no commissions to distribute
    if (!subscriber.referred_by) {
      return NextResponse.json({
        success: true,
        message: 'No referrer found, no commissions distributed',
        commissionsCreated: 0
      })
    }

    // Get commission structure for this plan
    const commissionConfig = COMMISSION_STRUCTURE[subscriptionPlan as keyof typeof COMMISSION_STRUCTURE]
    const commissionsCreated = []
    let currentReferralCode = subscriber.referred_by

    // Calculate payout eligible date (7 days from now)
    const payoutEligibleDate = new Date()
    payoutEligibleDate.setDate(payoutEligibleDate.getDate() + 7)

    // Traverse up the referral chain for 5 levels
    for (let level = 1; level <= 5; level++) {
      if (!currentReferralCode) break

      // Find the referrer at this level
      const { data: referrer, error: referrerError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, referral_code, referred_by, subscription_plan')
        .eq('referral_code', currentReferralCode)
        .single()

      if (referrerError || !referrer) {
        console.log(`Referrer not found at level ${level}: ${currentReferralCode}`)
        break
      }

      // Only pay commissions to Plus/Pro users (as per business rules)
      if (['plus', 'pro'].includes(referrer.subscription_plan)) {
        const levelConfig = commissionConfig.levels[level - 1]

        // Create referral commission record
        const { data: referralRecord, error: referralError } = await supabaseAdmin
          .from('referrals')
          .insert({
            referrer_id: referrer.id,
            referred_id: subscriber.id,
            level: level,
            subscription_plan: subscriptionPlan,
            commission_amount: levelConfig.amount,
            payout_eligible_date: payoutEligibleDate.toISOString(),
            paid_out: false
          })
          .select()
          .single()

        if (!referralError && referralRecord) {
          // Update referrer's pending payout - get current amount first
          const { data: currentReferrer, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('pending_payout')
            .eq('id', referrer.id)
            .single()

          if (!fetchError && currentReferrer) {
            const newPendingPayout = (currentReferrer.pending_payout || 0) + levelConfig.amount

            const { error: updateError } = await supabaseAdmin
              .from('profiles')
              .update({
                pending_payout: newPendingPayout,
                updated_at: new Date().toISOString()
              })
              .eq('id', referrer.id)

            if (!updateError) {
              commissionsCreated.push({
                level,
                referrer: {
                  id: referrer.id,
                  name: referrer.full_name,
                  email: referrer.email
                },
                amount: levelConfig.amount,
                percentage: levelConfig.percentage
              })
            }
          }
        }
      } else {
        console.log(`Referrer at level ${level} is not Plus/Pro, skipping commission`)
      }

      // Move to next level up the chain
      currentReferralCode = referrer.referred_by
    }

    return NextResponse.json({
      success: true,
      message: `Commissions distributed for ${subscriptionPlan} subscription`,
      subscriber: {
        id: subscriber.id,
        name: subscriber.full_name,
        email: subscriber.email
      },
      commissionsCreated: commissionsCreated.length,
      commissions: commissionsCreated
    })

  } catch (error) {
    console.error('Error distributing commissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method to check commission potential for a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const plan = searchParams.get('plan')

  if (!userId || !plan) {
    return NextResponse.json(
      { error: 'User ID and plan parameters required' },
      { status: 400 }
    )
  }

  try {
    // Get user's referral chain
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('referred_by')
      .eq('id', userId)
      .single()

    if (error || !user || !user.referred_by) {
      return NextResponse.json({
        hasReferrer: false,
        potentialCommissions: []
      })
    }

    const commissionConfig = COMMISSION_STRUCTURE[plan as keyof typeof COMMISSION_STRUCTURE]
    if (!commissionConfig) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const potentialCommissions = []
    let currentReferralCode = user.referred_by

    // Check potential commissions for each level
    for (let level = 1; level <= 5; level++) {
      if (!currentReferralCode) break

      const { data: referrer } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, subscription_plan, referred_by')
        .eq('referral_code', currentReferralCode)
        .single()

      if (!referrer) break

      const levelConfig = commissionConfig.levels[level - 1]
      potentialCommissions.push({
        level,
        referrer: {
          name: referrer.full_name,
          plan: referrer.subscription_plan,
          eligible: ['plus', 'pro'].includes(referrer.subscription_plan)
        },
        amount: levelConfig.amount,
        percentage: levelConfig.percentage
      })

      currentReferralCode = referrer.referred_by
    }

    return NextResponse.json({
      hasReferrer: true,
      plan,
      totalPotential: potentialCommissions
        .filter(c => c.referrer.eligible)
        .reduce((sum, c) => sum + c.amount, 0),
      potentialCommissions
    })

  } catch (error) {
    console.error('Error checking commission potential:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
