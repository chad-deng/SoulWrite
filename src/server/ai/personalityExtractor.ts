import { openai } from './openai'
import { personalityExtractionPrompt } from './prompts'

export interface CommunicationStyle {
  tone: string
  sentenceStructure: string
  vocabularyLevel: string
}

export interface RelationshipDynamics {
  affectionLevel: string
  communicationPattern: string
  insideJokes: string[]
}

export interface EmotionalPatterns {
  showsCare: string
  handlesStress: string
  sharesJoy: string
}

export interface PersonalityProfile {
  communicationStyle: CommunicationStyle
  commonPhrases: string[]
  frequentTopics: string[]
  relationshipDynamics: RelationshipDynamics
  values: string[]
  emotionalPatterns: EmotionalPatterns
  memories: string[]
}

export async function extractPersonality(
  name: string,
  content: string
): Promise<PersonalityProfile> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a personality analysis assistant. Extract structured personality profiles from chat content.',
        },
        {
          role: 'user',
          content: personalityExtractionPrompt(name, content),
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) {
      throw new Error('Empty response from OpenAI')
    }

    return JSON.parse(raw) as PersonalityProfile
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to extract personality: ${message}`)
  }
}
