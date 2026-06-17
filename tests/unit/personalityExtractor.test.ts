import { describe, test, expect, vi } from 'vitest'
import { extractPersonality, type PersonalityProfile } from '@/server/ai/personalityExtractor'

vi.mock('@/server/ai/anthropic', () => ({
  anthropic: {
    messages: {
      create: vi.fn(),
    },
  },
}))

import { anthropic } from '@/server/ai/anthropic'

const mockedCreate = vi.mocked(anthropic.messages.create)

describe('extractPersonality', () => {
  test('extracts personality from chat content', async () => {
    const mockProfile: PersonalityProfile = {
      communicationStyle: {
        tone: 'warm and playful',
        sentenceStructure: 'short and casual',
        vocabularyLevel: 'simple',
      },
      commonPhrases: ['hey there', 'lol', 'miss you'],
      frequentTopics: ['work', 'weekend plans'],
      relationshipDynamics: {
        affectionLevel: 'high',
        communicationPattern: 'frequent and open',
        insideJokes: ['the pancake incident'],
      },
      values: ['honesty', 'loyalty'],
      emotionalPatterns: {
        showsCare: 'checks in daily',
        handlesStress: 'talks it through',
        sharesJoy: 'celebrates loudly',
      },
      memories: ['first road trip together'],
    }

    mockedCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(mockProfile) }],
    } as any)

    const result = await extractPersonality('Alice', 'Alice: hey there! miss you lol')

    expect(result).toEqual(mockProfile)
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
      })
    )
  })

  test('throws error when API fails', async () => {
    mockedCreate.mockRejectedValueOnce(new Error('API down'))

    await expect(extractPersonality('Alice', 'some content')).rejects.toThrow(
      'Failed to extract personality'
    )
  })

  test('throws error on malformed JSON response', async () => {
    mockedCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not-valid-json' }],
    } as any)

    await expect(extractPersonality('Alice', 'some content')).rejects.toThrow(
      'Failed to extract personality'
    )
  })

  test('throws error when required fields are missing', async () => {
    const incompleteProfile = {
      communicationStyle: {
        tone: 'warm',
        sentenceStructure: 'short',
        vocabularyLevel: 'simple',
      },
      // missing commonPhrases, frequentTopics, relationshipDynamics, values, emotionalPatterns, memories
    }

    mockedCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(incompleteProfile) }],
    } as any)

    await expect(extractPersonality('Alice', 'some content')).rejects.toThrow(
      'Failed to extract personality'
    )
  })
})
