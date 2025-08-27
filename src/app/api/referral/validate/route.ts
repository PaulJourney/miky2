import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json()

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Referral code is required' },
        { status: 400 }
      )
    }

    // Clean and validate format
    const cleanCode = referralCode.trim().toUpperCase()

    if (cleanCode.length < 4 || cleanCode.length > 12) {
      return NextResponse.json(
        { valid: false, error: 'Invalid referral code format' },
        { status: 400 }
      )
    }

    // Check if referral code exists and get referrer info
    console.log('Searching for referral code:', cleanCode)

    const { data: referrer, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, referral_code, subscription_plan')
      .eq('referral_code', cleanCode)
      .single()

    console.log('Query result:', { referrer, error })

    if (error || !referrer) {
      // Try case-insensitive search as fallback
      const { data: referrerCaseInsensitive, error: caseError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, referral_code, subscription_plan')
        .ilike('referral_code', cleanCode)
        .single()

      console.log('Case-insensitive search:', { referrerCaseInsensitive, caseError })

      if (caseError || !referrerCaseInsensitive) {
        return NextResponse.json({
          valid: false,
          message: 'Referral code not found',
          debug: { searchedCode: cleanCode, originalError: error?.message }
        })
      }

      // Use the case-insensitive result
      return NextResponse.json({
        valid: true,
        referrer: {
          name: referrerCaseInsensitive.full_name || 'Miky User',
          plan: referrerCaseInsensitive.subscription_plan || 'free'
        },
        message: `Valid referral from ${referrerCaseInsensitive.full_name || 'Miky User'}`
      })
    }

    return NextResponse.json({
      valid: true,
      referrer: {
        name: referrer.full_name || 'Miky User',
        plan: referrer.subscription_plan || 'free'
      },
      message: `Valid referral from ${referrer.full_name || 'Miky User'}`
    })

  } catch (error) {
    console.error('Error validating referral code:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method for simple validation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json(
      { valid: false, error: 'Code parameter required' },
      { status: 400 }
    )
  }

  // Reuse POST logic
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ referralCode: code }),
    headers: { 'Content-Type': 'application/json' }
  }))
}
