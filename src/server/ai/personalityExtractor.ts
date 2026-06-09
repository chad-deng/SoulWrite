import { z } from 'zod'
import { openai } from './openai'
import { personalityExtractionPrompt } from './prompts'

export const communicationStyleSchema = z.object({
  tone: z.string(),
  sentenceStructure: z.string(),
  vocabularyLevel: z.string(),
})

export const relationshipDynamicsSchema = z.object({
  affectionLevel: z.string(),
  communicationPattern: z.string(),
  insideJokes: z.array(z.string()),
})

export const emotionalPatternsSchema = z.object({
  showsCare: z.string(),
  handlesStress: z.string(),
  sharesJoy: z.string(),
})

export const personalityProfileSchema = z.object({
  communicationStyle: communicationStyleSchema,
  commonPhrases: z.array(z.string()),
  frequentTopics: z.array(z.string()),
  relationshipDynamics: relationshipDynamicsSchema,
  values: z.array(z.string()),
  emotionalPatterns: emotionalPatternsSchema,
  memories: z.array(z.string()),
})

export type CommunicationStyle = z.infer<typeof communicationStyleSchema>
export type RelationshipDynamics = z.infer<typeof relationshipDynamicsSchema>
export type EmotionalPatterns = z.infer<typeof emotionalPatternsSchema>
export type PersonalityProfile = z.infer<typeof personalityProfileSchema>

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
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) {
      throw new Error('Empty response from OpenAI')
    }

    const parsed = JSON.parse(raw)
    return personalityProfileSchema.parse(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to extract personality: ${message}`)
  }
}
