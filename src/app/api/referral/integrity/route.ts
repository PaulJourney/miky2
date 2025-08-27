import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'check'

  try {
    switch (action) {
      case 'check':
        return await checkIntegrity()
      case 'fix-codes':
        return await fixMissingReferralCodes()
      case 'validate-chain':
        return await validateReferralChains()
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Integrity check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function checkIntegrity() {
  const issues = []
  const stats = {
    totalUsers: 0,
    usersWithReferralCode: 0,
    usersWithReferrer: 0,
    duplicateReferralCodes: 0,
    invalidReferralCodes: 0,
    brokenReferralChains: 0
  }

  // 1. Check all users have unique referral codes
  const { data: allProfiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, referral_code, referred_by')

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`)
  }

  stats.totalUsers = allProfiles.length

  // Check for missing referral codes
  const missingCodes = allProfiles.filter(p => !p.referral_code)
  stats.usersWithReferralCode = allProfiles.length - missingCodes.length

  if (missingCodes.length > 0) {
    issues.push({
      type: 'missing_referral_codes',
      severity: 'high',
      count: missingCodes.length,
      description: `${missingCodes.length} users without referral codes`,
      users: missingCodes.map(p => ({ id: p.id, email: p.email }))
    })
  }

  // Check for duplicate referral codes
  const codeGroups = allProfiles
    .filter(p => p.referral_code)
    .reduce((acc, profile) => {
      if (!acc[profile.referral_code]) {
        acc[profile.referral_code] = []
      }
      acc[profile.referral_code].push(profile)
      return acc
    }, {} as Record<string, any[]>)

  const duplicates = Object.entries(codeGroups)
    .filter(([_, profiles]) => profiles.length > 1)

  stats.duplicateReferralCodes = duplicates.length

  if (duplicates.length > 0) {
    issues.push({
      type: 'duplicate_referral_codes',
      severity: 'critical',
      count: duplicates.length,
      description: 'Multiple users with same referral code',
      duplicates: duplicates.map(([code, profiles]) => ({
        code,
        users: profiles.map(p => ({ id: p.id, email: p.email }))
      }))
    })
  }

  // Check referral code format
  const invalidCodes = allProfiles.filter(p =>
    p.referral_code && (
      p.referral_code.length < 4 ||
      p.referral_code.length > 12 ||
      !/^[A-Z0-9]+$/.test(p.referral_code)
    )
  )

  stats.invalidReferralCodes = invalidCodes.length

  if (invalidCodes.length > 0) {
    issues.push({
      type: 'invalid_referral_codes',
      severity: 'medium',
      count: invalidCodes.length,
      description: 'Users with invalid referral code format',
      users: invalidCodes.map(p => ({
        id: p.id,
        email: p.email,
        code: p.referral_code
      }))
    })
  }

  // Check broken referral chains
  const usersWithReferrer = allProfiles.filter(p => p.referred_by)
  stats.usersWithReferrer = usersWithReferrer.length

  const brokenChains = []
  for (const user of usersWithReferrer) {
    const referrerExists = allProfiles.some(p => p.referral_code === user.referred_by)
    if (!referrerExists) {
      brokenChains.push(user)
    }
  }

  stats.brokenReferralChains = brokenChains.length

  if (brokenChains.length > 0) {
    issues.push({
      type: 'broken_referral_chains',
      severity: 'medium',
      count: brokenChains.length,
      description: 'Users referred by non-existent referral codes',
      users: brokenChains.map(p => ({
        id: p.id,
        email: p.email,
        referred_by: p.referred_by
      }))
    })
  }

  return NextResponse.json({
    status: issues.length === 0 ? 'healthy' : 'issues_found',
    stats,
    issues,
    recommendations: generateRecommendations(issues),
    timestamp: new Date().toISOString()
  })
}

async function fixMissingReferralCodes() {
  // Find users without referral codes
  const { data: usersWithoutCodes, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .is('referral_code', null)

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  if (usersWithoutCodes.length === 0) {
    return NextResponse.json({
      message: 'No users without referral codes found',
      fixed: 0
    })
  }

  const fixed = []
  const failed = []

  for (const user of usersWithoutCodes) {
    try {
      // Generate unique code
      const code = generateReferralCode(user.email)

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          referral_code: code,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        failed.push({ user: user.email, error: updateError.message })
      } else {
        fixed.push({ user: user.email, code })
      }
    } catch (error) {
      failed.push({ user: user.email, error: (error as Error).message })
    }
  }

  return NextResponse.json({
    message: `Fixed ${fixed.length} users, ${failed.length} failed`,
    fixed,
    failed,
    timestamp: new Date().toISOString()
  })
}

async function validateReferralChains() {
  const { data: allProfiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, referral_code, referred_by, subscription_plan')

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`)
  }

  const chains = []
  const processedUsers = new Set()

  // Build referral chains
  for (const user of allProfiles) {
    if (processedUsers.has(user.id) || !user.referred_by) continue

    const chain = []
    let currentUser = user
    let depth = 0
    const maxDepth = 10 // Prevent infinite loops

    while (currentUser && depth < maxDepth) {
      chain.push({
        id: currentUser.id,
        email: currentUser.email,
        code: currentUser.referral_code,
        plan: currentUser.subscription_plan,
        level: depth + 1
      })

      processedUsers.add(currentUser.id)

      if (!currentUser.referred_by) break

      // Find the referrer
      const nextUser = allProfiles.find(p => p.referral_code === currentUser.referred_by)
      if (!nextUser) break

      currentUser = nextUser
      depth++
    }

    if (chain.length > 0) {
      chains.push(chain)
    }
  }

  // Analyze chains
  const analytics = {
    totalChains: chains.length,
    averageDepth: chains.reduce((sum, chain) => sum + chain.length, 0) / chains.length || 0,
    maxDepth: Math.max(...chains.map(chain => chain.length), 0),
    chainsBy5Levels: chains.filter(chain => chain.length >= 5).length,
    paidUsersInChains: chains.flat().filter(user => ['plus', 'pro'].includes(user.plan)).length
  }

  return NextResponse.json({
    analytics,
    chains: chains.slice(0, 10), // Return first 10 chains for inspection
    totalChainsFound: chains.length,
    timestamp: new Date().toISOString()
  })
}

function generateReferralCode(email: string): string {
  const timestamp = Date.now().toString(36)
  const emailHash = email.split('@')[0].slice(0, 4).toUpperCase()
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${emailHash}${randomPart}${timestamp.slice(-2)}`.substring(0, 10)
}

function generateRecommendations(issues: any[]): string[] {
  const recommendations = []

  for (const issue of issues) {
    switch (issue.type) {
      case 'missing_referral_codes':
        recommendations.push(`Fix ${issue.count} users without referral codes using: GET /api/referral/integrity?action=fix-codes`)
        break
      case 'duplicate_referral_codes':
        recommendations.push(`CRITICAL: Manually resolve ${issue.count} duplicate referral codes in database`)
        break
      case 'invalid_referral_codes':
        recommendations.push(`Update ${issue.count} users with invalid referral code formats`)
        break
      case 'broken_referral_chains':
        recommendations.push(`Clean up ${issue.count} broken referral chains`)
        break
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('System integrity is healthy - no action needed')
  }

  return recommendations
}

// POST method for admin actions (with authentication check)
export async function POST(request: NextRequest) {
  const { action, userIds } = await request.json()

  // This should include proper admin authentication
  // For now, just check for a simple secret
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    switch (action) {
      case 'regenerate_codes':
        return await regenerateReferralCodes(userIds)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function regenerateReferralCodes(userIds: string[]) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: 'User IDs array required' }, { status: 400 })
  }

  const results = []

  for (const userId of userIds) {
    try {
      const { data: user, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single()

      if (fetchError || !user) {
        results.push({ userId, status: 'failed', error: 'User not found' })
        continue
      }

      const newCode = generateReferralCode(user.email)

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          referral_code: newCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        results.push({ userId, status: 'failed', error: updateError.message })
      } else {
        results.push({ userId, status: 'success', newCode })
      }
    } catch (error) {
      results.push({ userId, status: 'failed', error: (error as Error).message })
    }
  }

  return NextResponse.json({
    message: `Processed ${userIds.length} users`,
    results,
    timestamp: new Date().toISOString()
  })
}
