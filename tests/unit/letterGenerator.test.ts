import { describe, test, expect, vi } from 'vitest'
import { generateLetter, type LetterOutput } from '@/server/ai/letterGenerator'

vi.mock('@/server/ai/anthropic', () => ({
  anthropic: {
    messages: {
      create: vi.fn(),
    },
  },
}))

import { anthropic } from '@/server/ai/anthropic'

const mockedCreate = vi.mocked(anthropic.messages.create)

describe('generateLetter', () => {
  test('generates a letter with reality anchor', async () => {
    const mockLetter = '亲爱的儿子，\n\n最近天气转凉了，记得多加衣服。'

    mockedCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: mockLetter }],
    } as unknown as Awaited<ReturnType<typeof mockedCreate>>)

    const result = await generateLetter({
      deceasedName: '父亲',
      relationship: '父子',
      personalityJson: '{"tone": "warm"}',
      tone: '温暖',
      currentContext: '秋天',
    })

    expect(result.content).toBe(mockLetter)
    expect(result.tone).toBe('温暖')
    expect(result.realityAnchor).toBe('这封信来自AI对父亲的记忆重建')
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
      })
    )
  })

  test('throws error when generation fails', async () => {
    mockedCreate.mockRejectedValueOnce(new Error('API down'))

    await expect(
      generateLetter({
        deceasedName: '母亲',
        relationship: '母子',
        personalityJson: '{"tone": "gentle"}',
        tone: '温柔',
      })
    ).rejects.toThrow('Failed to generate letter')
  })

  test('works without currentContext', async () => {
    const mockLetter = '亲爱的女儿，\n\n愿你每天都开心。'

    mockedCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: mockLetter }],
    } as unknown as Awaited<ReturnType<typeof mockedCreate>>)

    const result = await generateLetter({
      deceasedName: '母亲',
      relationship: '母女',
      personalityJson: '{"tone": "gentle"}',
      tone: '温柔',
    })

    expect(result.content).toBe(mockLetter)
    expect(result.tone).toBe('温柔')
    expect(result.realityAnchor).toBe('这封信来自AI对母亲的记忆重建')
  })
})
