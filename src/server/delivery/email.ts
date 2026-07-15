import nodemailer from 'nodemailer'

export interface SendLetterEmailParams {
  to: string
  fromName: string
  subject: string
  content: string
  realityAnchor: string
}

interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.FROM_EMAIL

  if (!host || !port || !user || !pass || !from) {
    throw new Error('SMTP configuration is incomplete')
  }

  return {
    host,
    port: Number(port),
    secure: Number(port) === 465,
    user,
    pass,
    from,
  }
}

function createTransporter() {
  const config = getSmtpConfig()

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })
}

export async function sendLetterEmail(params: SendLetterEmailParams): Promise<void> {
  const config = getSmtpConfig()
  const transporter = createTransporter()

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
      <h2 style="color: #0f172a;">${params.subject}</h2>
      <div style="white-space: pre-wrap; line-height: 1.6;">${params.content.replace(/\n/g, '<br/>')}</div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"/>
      <p style="font-size: 12px; color: #94a3b8;">${params.realityAnchor}</p>
    </div>
  `

  try {
    await transporter.sendMail({
      from: `"${params.fromName}" <${config.from}>`,
      to: params.to,
      subject: params.subject,
      text: `${params.content}\n\n${params.realityAnchor}`,
      html,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // eslint-disable-next-line no-console
    console.error('SMTP send failed:', message, { to: params.to, from: config.from })
    throw new Error(`SMTP send failed: ${message}`)
  }
}

export interface SendPasswordResetEmailParams {
  to: string
  resetUrl: string
}

export async function sendPasswordResetEmail(params: SendPasswordResetEmailParams): Promise<void> {
  const config = getSmtpConfig()
  const transporter = createTransporter()

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
      <h2 style="color: #0f172a;">Reset Your Password</h2>
      <p>We received a request to reset your password for your SoulWrite account.</p>
      <p>Click the button below to set a new password. This link expires in 1 hour.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${params.resetUrl}"
           style="display: inline-block; background: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Reset Password
        </a>
      </div>
      <p style="font-size: 14px; color: #64748b;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"/>
      <p style="font-size: 12px; color: #94a3b8;">SoulWrite — Letters from the people who matter most.</p>
    </div>
  `

  try {
    await transporter.sendMail({
      from: `"SoulWrite" <${config.from}>`,
      to: params.to,
      subject: 'Reset your SoulWrite password',
      text: `Reset your password: ${params.resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
      html,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // eslint-disable-next-line no-console
    console.error('Password reset email failed:', message, { to: params.to })
    throw new Error(`Password reset email failed: ${message}`)
  }
}
