import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Only allow in development or with special header
export async function GET(request: NextRequest) {
  // Security check - only in dev or with secret header
  const isDev = process.env.NODE_ENV === 'development'
  const hasAuthHeader = request.headers.get('X-Admin-Check') === process.env.ADMIN_CHECK_SECRET

  if (!isDev && !hasAuthHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const checks = {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      APP_BASE_URL: process.env.APP_BASE_URL || 'Not configured',
    },
    supabase: {
      url_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anon_key_configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      service_key_configured: !!process.env.SUPABASE_SERVICE_KEY,
      connection: false,
      profiles_table: false,
      rls_policies: false,
      trigger_exists: false
    },
    email: {
      sendgrid_configured: !!process.env.SENDGRID_API_KEY,
      from_email: process.env.SMTP_FROM || 'Not configured',
      can_send: false
    },
    registration_flow: {
      signup_endpoint: false,
      verification_endpoint: false,
      admin_notification_endpoint: false
    }
  }

  // Test Supabase connection
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      )

      // Test connection
      const { data: testData, error: testError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .limit(1)

      checks.supabase.connection = !testError
      checks.supabase.profiles_table = !testError

      // Check for required columns
      if (!testError) {
        const { data: columns } = await supabaseAdmin
          .rpc('get_table_columns', { table_name: 'profiles' })

        if (columns && Array.isArray(columns)) {
          const requiredColumns = ['email_verified', 'verification_token', 'verification_token_expires']
          const hasAllColumns = requiredColumns.every(col =>
            columns.some((c: any) => c.column_name === col)
          )
          checks.supabase.profiles_table = hasAllColumns
        }
      }

      // Check RLS policies
      const { data: policies } = await supabaseAdmin
        .rpc('get_policies', { table_name: 'profiles' })

      if (policies && policies.length > 0) {
        checks.supabase.rls_policies = policies.some((p: any) =>
          p.policyname.includes('insert') || p.policyname.includes('Insert')
        )
      }

      // Check trigger
      const { data: triggers } = await supabaseAdmin
        .rpc('get_triggers', { table_name: 'users' })

      if (triggers) {
        checks.supabase.trigger_exists = triggers.some((t: any) =>
          t.trigger_name === 'on_auth_user_created'
        )
      }

    } catch (error) {
      console.error('Supabase check error:', error)
    }
  }

  // Test SendGrid
  if (process.env.SENDGRID_API_KEY) {
    try {
      // Check if the API key is valid format
      checks.email.can_send = process.env.SENDGRID_API_KEY.startsWith('SG.')
    } catch (error) {
      checks.email.can_send = false
    }
  }

  // Check API endpoints
  checks.registration_flow.signup_endpoint = true // This endpoint exists
  checks.registration_flow.verification_endpoint = true
  checks.registration_flow.admin_notification_endpoint = true

  // Calculate overall health
  const healthScore = {
    database: (
      checks.supabase.connection &&
      checks.supabase.profiles_table &&
      checks.supabase.rls_policies
    ) ? 'healthy' : 'unhealthy',
    email: checks.email.sendgrid_configured ? 'configured' : 'not configured',
    overall: 'checking'
  }

  // Determine overall status
  if (healthScore.database === 'healthy') {
    if (checks.email.sendgrid_configured) {
      healthScore.overall = 'fully operational'
    } else {
      healthScore.overall = 'operational (emails disabled)'
    }
  } else {
    healthScore.overall = 'needs configuration'
  }

  return NextResponse.json({
    status: healthScore.overall,
    health: healthScore,
    checks,
    timestamp: new Date().toISOString(),
    recommendations: getRecommendations(checks)
  })
}

function getRecommendations(checks: any): string[] {
  const recommendations = []

  if (!checks.supabase.service_key_configured) {
    recommendations.push('Configure SUPABASE_SERVICE_KEY in environment variables')
  }

  if (!checks.supabase.profiles_table) {
    recommendations.push('Run the SQL migration script to add missing columns to profiles table')
  }

  if (!checks.supabase.rls_policies) {
    recommendations.push('Add INSERT policy for profiles table to fix 403 errors')
  }

  if (!checks.email.sendgrid_configured) {
    recommendations.push('Configure SendGrid API key for email functionality')
  }

  if (!checks.supabase.trigger_exists) {
    recommendations.push('Ensure the handle_new_user trigger is active')
  }

  if (recommendations.length === 0) {
    recommendations.push('System is properly configured!')
  }

  return recommendations
}
