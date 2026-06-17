import { anthropic } from './anthropic'
import { letterGenerationPrompt } from './prompts'
import type { WeatherInfo } from './weather'

export interface LetterOutput {
  content: string
  tone: string
  realityAnchor: string
}

interface LetterUpdate {
  content: string
  imageUrl?: string | null
  createdAt: Date
}

interface GenerateLetterParams {
  deceasedName: string
  relationship: string
  recipientNickname?: string
  personalityJson: string
  tone: string
  currentContext?: string
  weather?: WeatherInfo | null
  recentUpdates?: LetterUpdate[]
}

export async function generateLetter(params: GenerateLetterParams): Promise<LetterOutput> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system:
        'You are a compassionate letter-writing assistant. Write heartfelt letters in the voice of the described person. Always write in Chinese. End every letter with the provided reality anchor sentence exactly as given.',
      messages: [
        {
          role: 'user',
          content: letterGenerationPrompt(params),
        },
      ],
    })

    const content = response.content[0]?.type === 'text' ? response.content[0].text : ''

    if (!content || content.trim().length === 0) {
      throw new Error('Generated letter is empty')
    }

    return {
      content,
      tone: params.tone,
      realityAnchor: `这封信来自AI对${params.deceasedName}的记忆重建`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to generate letter: ${message}`)
  }
}
