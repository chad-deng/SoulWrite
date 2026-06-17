import { describe, test, expect, vi, beforeEach } from 'vitest'

const sendMailMock = vi.fn()

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: sendMailMock,
    })),
  },
  createTransport: vi.fn(() => ({
    sendMail: sendMailMock,
  })),
}))

import { sendLetterEmail } from '@/server/delivery/email'

describe('sendLetterEmail', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    sendMailMock.mockReset()
  })

  test('sends email with content and reality anchor', async () => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.com')
    vi.stubEnv('SMTP_PORT', '587')
    vi.stubEnv('SMTP_USER', 'user@example.com')
    vi.stubEnv('SMTP_PASS', 'secret')
    vi.stubEnv('FROM_EMAIL', 'noreply@example.com')

    sendMailMock.mockResolvedValue({ messageId: '123' })

    await sendLetterEmail({
      to: 'recipient@example.com',
      fromName: 'Rose',
      subject: 'A letter from Rose',
      content: 'Dear child, ...',
      realityAnchor: '这封信来自AI对Rose的记忆重建',
    })

    expect(sendMailMock).toHaveBeenCalledTimes(1)
    const call = sendMailMock.mock.calls[0][0]
    expect(call.to).toBe('recipient@example.com')
    expect(call.subject).toBe('A letter from Rose')
    expect(call.text).toContain('Dear child, ...')
    expect(call.html).toContain('这封信来自AI对Rose的记忆重建')
  })

  test('throws when SMTP config is missing', async () => {
    vi.stubEnv('SMTP_HOST', '')

    await expect(
      sendLetterEmail({
        to: 'recipient@example.com',
        fromName: 'Rose',
        subject: 'A letter from Rose',
        content: 'Dear child',
        realityAnchor: 'Anchor',
      })
    ).rejects.toThrow('SMTP configuration is incomplete')
  })
})
