import { describe, expect, it, vi, beforeEach } from 'vitest'

import { generateLetter } from './letterGenerator'

const createMock = vi.fn()

vi.mock('./openai', () => ({
  openai: {
    chat: {
      completions: {
        create: (...args: unknown[]) => createMock(...args),
      },
    },
  },
}))

describe('generateLetter', () => {
  beforeEach(() => {
    createMock.mockReset()
  })

  it('returns generated content with tone and reality anchor', async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: '亲爱的孩子，今天上海下雨了。' } }],
    })

    const result = await generateLetter({
      deceasedName: 'Rose',
      relationship: 'grandmother',
      personalityJson: '{}',
      tone: 'comforting',
      weather: {
        location: 'Shanghai',
        description: '小雨',
        temperature: 20,
      },
      recentUpdates: [
        { content: 'Passed my driving test.', createdAt: new Date() },
      ],
    })

    expect(result.content).toBe('亲爱的孩子，今天上海下雨了。')
    expect(result.tone).toBe('comforting')
    expect(result.realityAnchor).toBe('这封信来自AI对Rose的记忆重建')
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  it('throws when the model returns empty content', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: '' } }] })

    await expect(
      generateLetter({
        deceasedName: 'Rose',
        relationship: 'grandmother',
        personalityJson: '{}',
        tone: 'comforting',
      })
    ).rejects.toThrow('Generated letter is empty')
  })
})
