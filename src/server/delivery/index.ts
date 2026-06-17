import { sendLetterEmail } from './email'

export interface LetterDeliveryParams {
  channel: string
  to: string
  fromName: string
  subject: string
  content: string
  realityAnchor: string
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

  throw new Error(`Delivery channel not implemented: ${params.channel}`)
}

export const SUPPORTED_CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'wechat', label: 'WeChat', disabled: true },
  { value: 'dingtalk', label: 'DingTalk', disabled: true },
  { value: 'lark', label: 'Lark / Feishu', disabled: true },
  { value: 'qq', label: 'QQ', disabled: true },
] as const
