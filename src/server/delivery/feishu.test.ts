import { describe, test, expect, vi, beforeEach } from 'vitest'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

import { sendLetterFeishu } from '@/server/delivery/feishu'

describe('sendLetterFeishu', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  test('sends interactive card to webhook URL', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 0, msg: 'success' }),
    })

    await sendLetterFeishu({
      webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test-hook-id',
      fromName: 'Rose',
      content: 'Dear child, I miss you.',
      realityAnchor: '这封信来自AI对Rose的记忆重建',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://open.feishu.cn/open-apis/bot/v2/hook/test-hook-id')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body)
    expect(body.msg_type).toBe('interactive')
    expect(body.card.header.title.content).toContain('Rose')
    expect(body.card.elements[0].text.content).toBe('Dear child, I miss you.')
    expect(body.card.elements[2].elements[0].content).toBe('这封信来自AI对Rose的记忆重建')
    expect(body.timestamp).toBeUndefined()
    expect(body.sign).toBeUndefined()
  })

  test('includes signature when secret is provided', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 0, msg: 'success' }),
    })

    await sendLetterFeishu({
      webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test-hook-id',
      webhookSecret: 'test-secret',
      fromName: 'Rose',
      content: 'Hello',
      realityAnchor: 'Anchor',
    })

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.timestamp).toBeDefined()
    expect(body.sign).toBeDefined()
    expect(typeof body.timestamp).toBe('string')
    expect(typeof body.sign).toBe('string')
  })

  test('throws on non-OK response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad Request'),
    })

    await expect(
      sendLetterFeishu({
        webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/bad',
        fromName: 'Rose',
        content: 'Hello',
        realityAnchor: 'Anchor',
      })
    ).rejects.toThrow('Feishu webhook failed (400)')
  })

  test('throws on API error in response body', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 9499, msg: 'invalid webhook' }),
    })

    await expect(
      sendLetterFeishu({
        webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/bad',
        fromName: 'Rose',
        content: 'Hello',
        realityAnchor: 'Anchor',
      })
    ).rejects.toThrow('Feishu API error: invalid webhook (code: 9499)')
  })
})
