import { sendLetterEmail } from './email'
import { sendLetterDingtalk } from './dingtalk'
import { sendLetterFeishu } from './feishu'

export interface LetterDeliveryParams {
  channel: string
  to: string
  fromName: string
  subject: string
  content: string
  realityAnchor: string
  webhookUrl?: string
  webhookSecret?: string
}

export async function deliverLetter(params: LetterDeliveryParams): Promise<void> {
  if (params.channel === 'email') {
    await sendLetterEmail({
      to: params.to,
      fromName: params.fromName,
      subject: params.subject,
      content: params.content,
      realityAnchor: params.realityAnchor,
    })
    return
  }

  if (params.channel === 'lark') {
    if (!params.webhookUrl) {
      throw new Error('Feishu webhook URL is not configured')
    }
    await sendLetterFeishu({
      webhookUrl: params.webhookUrl,
      webhookSecret: params.webhookSecret,
      fromName: params.fromName,
      content: params.content,
      realityAnchor: params.realityAnchor,
    })
    return
  }

  if (params.channel === 'dingtalk') {
    if (!params.webhookUrl) {
      throw new Error('DingTalk webhook URL is not configured')
    }
    await sendLetterDingtalk({
      webhookUrl: params.webhookUrl,
      webhookSecret: params.webhookSecret,
      fromName: params.fromName,
      content: params.content,
      realityAnchor: params.realityAnchor,
    })
    return
  }

  throw new Error(`Delivery channel not implemented: ${params.channel}`)
}

export const SUPPORTED_CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'wechat', label: 'WeChat', disabled: true },
  { value: 'dingtalk', label: 'DingTalk' },
  { value: 'lark', label: 'Lark / Feishu' },
  { value: 'qq', label: 'QQ', disabled: true },
] as const
