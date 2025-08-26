import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/email'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, userId } = await request.json()

    if (!email || !fullName || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Genera un token di verifica semplice
    const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36)

    // Salva il token nel profilo (se necessario per verifica custom)
    await supabaseAdmin
      .from('profiles')
      .update({
        verification_token: verificationToken,
        verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 ore
      })
      .eq('id', userId)

    // Invia email di verifica
    await sendVerificationEmail(email, fullName, verificationToken)

    console.log(`Verification email sent to ${email}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending verification email:', error)
    // Non fallire la registrazione se l'email fallisce
    return NextResponse.json({ success: false, error: 'Email sending failed but registration successful' })
  }
}
