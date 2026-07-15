import { describe, test, expect, vi, beforeEach } from 'vitest'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

import { sendLetterDingtalk } from '@/server/delivery/dingtalk'

describe('sendLetterDingtalk', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  test('sends markdown message to webhook URL', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ errcode: 0, errmsg: 'ok' }),
    })

    await sendLetterDingtalk({
      webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=test-token',
      fromName: 'Rose',
      content: 'Dear child, I miss you.',
      realityAnchor: '这封信来自AI对Rose的记忆重建',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://oapi.dingtalk.com/robot/send?access_token=test-token')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body)
    expect(body.msgtype).toBe('markdown')
    expect(body.markdown.title).toBe('A letter from Rose')
    expect(body.markdown.text).toContain('Dear child, I miss you.')
    expect(body.markdown.text).toContain('这封信来自AI对Rose的记忆重建')
    expect(body.markdown.text).toContain('## ✉️ A letter from Rose')
  })

  test('appends sign params to URL when secret is provided', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ errcode: 0, errmsg: 'ok' }),
    })

    await sendLetterDingtalk({
      webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=test-token',
      webhookSecret: 'test-secret',
      fromName: 'Rose',
      content: 'Hello',
      realityAnchor: 'Anchor',
    })

    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain('timestamp=')
    expect(url).toContain('sign=')
    expect(url).toMatch(/^https:\/\/oapi\.dingtalk\.com\/robot\/send\?access_token=test-token&/)
  })

  test('throws on non-OK response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Forbidden'),
    })

    await expect(
      sendLetterDingtalk({
        webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=bad',
        fromName: 'Rose',
        content: 'Hello',
        realityAnchor: 'Anchor',
      })
    ).rejects.toThrow('DingTalk webhook failed (403)')
  })

  test('throws on API error in response body', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ errcode: 310000, errmsg: 'invalid token' }),
    })

    await expect(
      sendLetterDingtalk({
        webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=bad',
        fromName: 'Rose',
        content: 'Hello',
        realityAnchor: 'Anchor',
      })
    ).rejects.toThrow('DingTalk API error: invalid token (code: 310000)')
  })
})
