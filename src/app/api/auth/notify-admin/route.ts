import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

const FROM_EMAIL = process.env.SMTP_FROM || 'support@miky.ai'
const ADMIN_EMAIL = 'support@miky.ai'

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, referralCode, userId } = await request.json()

    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Invia notifica a support@miky.ai
    const msg = {
      to: ADMIN_EMAIL,
      from: FROM_EMAIL,
      subject: `🆕 Nuova registrazione: ${fullName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; background: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; padding: 20px; background: white; border-radius: 10px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
            .info-box { background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
            .label { font-weight: bold; color: #555; }
            .value { color: #333; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🎉 Nuova Registrazione su Miky.ai</h2>
            </div>

            <div class="info-box">
              <p><span class="label">Nome:</span> <span class="value">${fullName}</span></p>
              <p><span class="label">Email:</span> <span class="value">${email}</span></p>
              <p><span class="label">User ID:</span> <span class="value">${userId || 'N/A'}</span></p>
              <p><span class="label">Data:</span> <span class="value">${new Date().toLocaleString('it-IT')}</span></p>
              ${referralCode ? `<p><span class="label">Referral Code Usato:</span> <span class="value">${referralCode}</span></p>` : '<p><span class="label">Referral:</span> <span class="value">Registrazione diretta</span></p>'}
              <p><span class="label">Crediti iniziali:</span> <span class="value">100</span></p>
            </div>

            <p style="color: #666;">
              L'utente riceverà un'email di conferma. Una volta confermato, l'account sarà attivo.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

            <p style="font-size: 12px; color: #999; text-align: center;">
              Questa è una notifica automatica dal sistema Miky.ai
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Nuova Registrazione su Miky.ai

        Nome: ${fullName}
        Email: ${email}
        User ID: ${userId || 'N/A'}
        Data: ${new Date().toLocaleString('it-IT')}
        ${referralCode ? `Referral Code: ${referralCode}` : 'Registrazione diretta'}
        Crediti iniziali: 100

        L'utente riceverà un'email di conferma.
      `
    }

    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg)
      console.log(`Admin notification sent for new user: ${email}`)
    } else {
      console.warn('SendGrid not configured - skipping admin notification')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending admin notification:', error)
    // Non bloccare la registrazione se la notifica fallisce
    return NextResponse.json({ success: false, warning: 'Admin notification failed' })
  }
}
