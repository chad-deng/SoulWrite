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

  await transporter.sendMail({
    from: `"${params.fromName}" <${config.from}>`,
    to: params.to,
    subject: params.subject,
    text: `${params.content}\n\n${params.realityAnchor}`,
    html,
  })
}
