import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Find users who have referral but only 100 credits
    const { data: usersToFix, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, referred_by, credits, created_at')
      .not('referred_by', 'is', null)
      .neq('referred_by', '')
      .eq('credits', 100)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Error finding users: ${error.message}`)
    }

    return NextResponse.json({
      usersNeedingFix: usersToFix?.length || 0,
      users: usersToFix || [],
      message: `Found ${usersToFix?.length || 0} users with referral who need credit correction`
    })

  } catch (error) {
    console.error('Error checking users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, userEmail } = await request.json()

    if (action === 'fix_all') {
      // Fix all users who have referral but only 100 credits
      const { data: usersToFix, error: findError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, referred_by, credits')
        .not('referred_by', 'is', null)
        .neq('referred_by', '')
        .eq('credits', 100)

      if (findError) {
        throw new Error(`Error finding users: ${findError.message}`)
      }

      const results = []

      for (const user of usersToFix || []) {
        try {
          // Update credits from 100 to 200
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              credits: 200,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

          if (updateError) {
            results.push({
              email: user.email,
              status: 'failed',
              error: updateError.message
            })
          } else {
            results.push({
              email: user.email,
              status: 'fixed',
              oldCredits: 100,
              newCredits: 200
            })

            // Log the fix
            await supabaseAdmin
              .from('admin_notifications')
              .insert({
                user_id: user.id,
                email: user.email,
                full_name: 'Credit Fix',
                notification_type: 'credit_correction',
                metadata: {
                  old_credits: 100,
                  new_credits: 200,
                  reason: 'referral_credit_fix',
                  referred_by: user.referred_by,
                  fixed_at: new Date().toISOString()
                }
              })
          }
        } catch (userError) {
          results.push({
            email: user.email,
            status: 'error',
            error: (userError as Error).message
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: `Fixed credits for ${results.filter(r => r.status === 'fixed').length} users`,
        results,
        totalProcessed: results.length
      })

    } else if (action === 'fix_user' && userEmail) {
      // Fix specific user
      const { data: user, error: findError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, referred_by, credits')
        .eq('email', userEmail)
        .single()

      if (findError || !user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      if (!user.referred_by) {
        return NextResponse.json(
          { error: 'User has no referral code' },
          { status: 400 }
        )
      }

      if (user.credits !== 100) {
        return NextResponse.json({
          message: 'User already has correct credits',
          currentCredits: user.credits
        })
      }

      // Update credits
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          credits: 200,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        throw new Error(`Error updating user: ${updateError.message}`)
      }

      return NextResponse.json({
        success: true,
        message: `Fixed credits for ${userEmail}`,
        oldCredits: 100,
        newCredits: 200
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error fixing credits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
