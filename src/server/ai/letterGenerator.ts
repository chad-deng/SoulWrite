import { openai } from './openai'
import { letterGenerationPrompt } from './prompts'

export interface LetterOutput {
  content: string
  tone: string
  realityAnchor: string
}

interface GenerateLetterParams {
  deceasedName: string
  relationship: string
  personalityJson: string
  tone: string
  currentContext?: string
}

export async function generateLetter(params: GenerateLetterParams): Promise<LetterOutput> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a compassionate letter-writing assistant.',
        },
        {
          role: 'user',
          content: letterGenerationPrompt(params),
        },
      ],
      temperature: 0.8,
      max_tokens: 1200,
    })

    const content = response.choices[0]?.message?.content ?? ''

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
