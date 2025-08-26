import sgMail from '@sendgrid/mail'

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@miky.ai'
const ADMIN_EMAIL = 'support@miky.ai'

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

/**
 * Send confirmation email to user after registration
 */
export async function sendConfirmationEmail(
  toEmail: string,
  userName: string,
  confirmationUrl: string
): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid not configured - skipping confirmation email')
    return false
  }

  const msg = {
    to: toEmail,
    from: FROM_EMAIL,
    subject: 'Conferma la tua email - Miky.ai',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Benvenuto su Miky.ai!</h1>
            </div>
            <div class="content">
              <p>Ciao ${userName},</p>
              <p>Grazie per esserti registrato su Miky.ai! Siamo entusiasti di averti con noi.</p>
              <p>Per completare la registrazione e attivare il tuo account, conferma il tuo indirizzo email cliccando sul pulsante qui sotto:</p>
              <center>
                <a href="${confirmationUrl}" class="button">Conferma Email</a>
              </center>
              <p>O copia e incolla questo link nel tuo browser:</p>
              <p style="word-break: break-all; color: #667eea;">${confirmationUrl}</p>
              <p><strong>Cosa ti aspetta:</strong></p>
              <ul>
                <li>100 crediti gratuiti per iniziare</li>
                <li>8 AI specializzati per ogni esigenza</li>
                <li>1 litro di oceano pulito per ogni messaggio</li>
                <li>Sistema referral per guadagnare</li>
              </ul>
              <p>Il link di conferma scadrà tra 24 ore per motivi di sicurezza.</p>
            </div>
            <div class="footer">
              <p>© 2025 Miky.ai - Tutti i diritti riservati</p>
              <p>Hai bisogno di aiuto? Contattaci a support@miky.ai</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Benvenuto su Miky.ai!

      Ciao ${userName},

      Grazie per esserti registrato su Miky.ai!

      Conferma il tuo indirizzo email visitando questo link:
      ${confirmationUrl}

      Il link scadrà tra 24 ore.

      © 2025 Miky.ai
    `
  }

  try {
    await sgMail.send(msg)
    console.log('Confirmation email sent to:', toEmail)
    return true
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    return false
  }
}

/**
 * Send notification to admin about new registration
 */
export async function sendAdminNotification(
  userEmail: string,
  userName: string,
  referralCode?: string
): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid not configured - skipping admin notification')
    return false
  }

  const msg = {
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject: `Nuova registrazione: ${userName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .info-box { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .label { font-weight: bold; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🎉 Nuova Registrazione su Miky.ai</h2>
            <div class="info-box">
              <p><span class="label">Nome:</span> ${userName}</p>
              <p><span class="label">Email:</span> ${userEmail}</p>
              <p><span class="label">Data:</span> ${new Date().toLocaleString('it-IT')}</p>
              ${referralCode ? `<p><span class="label">Referral Code:</span> ${referralCode}</p>` : ''}
              <p><span class="label">Crediti iniziali:</span> 100</p>
            </div>
            <p>L'utente riceverà un'email di conferma per attivare l'account.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Nuova Registrazione su Miky.ai

      Nome: ${userName}
      Email: ${userEmail}
      Data: ${new Date().toLocaleString('it-IT')}
      ${referralCode ? `Referral Code: ${referralCode}` : ''}
      Crediti iniziali: 100
    `
  }

  try {
    await sgMail.send(msg)
    console.log('Admin notification sent for:', userEmail)
    return true
  } catch (error) {
    console.error('Error sending admin notification:', error)
    return false
  }
}

/**
 * Send welcome email after email confirmation
 */
export async function sendWelcomeEmail(
  toEmail: string,
  userName: string
): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid not configured - skipping welcome email')
    return false
  }

  const msg = {
    to: toEmail,
    from: FROM_EMAIL,
    subject: 'Benvenuto su Miky.ai - Il tuo account è attivo!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Account Attivato!</h1>
            </div>
            <div class="content">
              <p>Ciao ${userName},</p>
              <p>Il tuo account Miky.ai è ora attivo! Ecco cosa puoi fare:</p>

              <div class="feature">
                <strong>💬 Chat con 8 AI Specializzati</strong>
                <p>Accedi a esperti AI per ogni necessità: Academic, Engineer, Marketer, e altri.</p>
              </div>

              <div class="feature">
                <strong>🌊 Pulisci l'Oceano</strong>
                <p>Ogni messaggio contribuisce a rimuovere 1 litro di plastica dagli oceani.</p>
              </div>

              <div class="feature">
                <strong>💰 Guadagna con i Referral</strong>
                <p>Invita amici e guadagna fino a 5 livelli di commissioni.</p>
              </div>

              <center>
                <a href="https://www.miky.ai/dashboard" class="button">Inizia Ora</a>
              </center>

              <p><strong>I tuoi 100 crediti gratuiti sono già disponibili!</strong></p>
            </div>
            <div class="footer" style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
              <p>Hai domande? Contattaci a support@miky.ai</p>
              <p>© 2025 Miky.ai - Tutti i diritti riservati</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  try {
    await sgMail.send(msg)
    console.log('Welcome email sent to:', toEmail)
    return true
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return false
  }
}

/**
 * Generate confirmation URL
 */
export function generateConfirmationUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.miky.ai'
  return `${baseUrl}/auth/verify?token=${token}`
}

/**
 * Generate random token
 */
export function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
