import { createHmac } from 'crypto'

export interface SendLetterFeishuParams {
  webhookUrl: string
  webhookSecret?: string
  fromName: string
  content: string
  realityAnchor: string
}

interface FeishuCardPayload {
  msg_type: 'interactive'
  timestamp?: string
  sign?: string
  card: {
    header: {
      title: { tag: string; content: string }
      template: string
    }
    elements: Array<
      | { tag: 'div'; text: { tag: string; content: string } }
      | { tag: 'hr' }
      | { tag: 'note'; elements: Array<{ tag: string; content: string }> }
    >
  }
}

function generateSign(secret: string, timestamp: string): string {
  const stringToSign = `${timestamp}\n${secret}`
  return createHmac('sha256', stringToSign).update('').digest('base64')
}

function buildCardPayload(params: SendLetterFeishuParams): FeishuCardPayload {
  const payload: FeishuCardPayload = {
    msg_type: 'interactive',
    card: {
      header: {
        title: { tag: 'plain_text', content: `✉️ A letter from ${params.fromName}` },
        template: 'indigo',
      },
      elements: [
        {
          tag: 'div',
          text: { tag: 'lark_md', content: params.content },
        },
        { tag: 'hr' },
        {
          tag: 'note',
          elements: [{ tag: 'plain_text', content: params.realityAnchor }],
        },
      ],
    },
  }

  if (params.webhookSecret) {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    payload.timestamp = timestamp
    payload.sign = generateSign(params.webhookSecret, timestamp)
  }

  return payload
}

export async function sendLetterFeishu(params: SendLetterFeishuParams): Promise<void> {
  const payload = buildCardPayload(params)

  const response = await fetch(params.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Feishu webhook failed (${response.status}): ${text}`)
  }

  const result = (await response.json()) as { code?: number; msg?: string }
  if (result.code !== 0) {
    throw new Error(`Feishu API error: ${result.msg ?? 'unknown error'} (code: ${result.code})`)
  }
}
