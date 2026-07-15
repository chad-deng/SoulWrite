import { createHmac } from 'crypto'

export interface SendLetterDingtalkParams {
  webhookUrl: string
  webhookSecret?: string
  fromName: string
  content: string
  realityAnchor: string
}

interface DingtalkMarkdownPayload {
  msgtype: 'markdown'
  timestamp?: string
  sign?: string
  markdown: {
    title: string
    text: string
  }
}

function generateSign(secret: string, timestamp: string): string {
  const stringToSign = `${timestamp}\n${secret}`
  return createHmac('sha256', stringToSign).update('').digest('base64')
}

function appendSignParams(url: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const sign = generateSign(secret, timestamp)
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}timestamp=${encodeURIComponent(timestamp)}&sign=${encodeURIComponent(sign)}`
}

function buildMarkdownPayload(params: SendLetterDingtalkParams): DingtalkMarkdownPayload {
  return {
    msgtype: 'markdown',
    markdown: {
      title: `A letter from ${params.fromName}`,
      text: [
        `## ✉️ A letter from ${params.fromName}`,
        '',
        params.content,
        '',
        '---',
        '',
        params.realityAnchor,
      ].join('\n'),
    },
  }
}

export async function sendLetterDingtalk(params: SendLetterDingtalkParams): Promise<void> {
  const url = params.webhookSecret
    ? appendSignParams(params.webhookUrl, params.webhookSecret)
    : params.webhookUrl

  const payload = buildMarkdownPayload(params)

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`DingTalk webhook failed (${response.status}): ${text}`)
  }

  const result = (await response.json()) as { errcode?: number; errmsg?: string }
  if (result.errcode !== 0) {
    throw new Error(`DingTalk API error: ${result.errmsg ?? 'unknown error'} (code: ${result.errcode})`)
  }
}
