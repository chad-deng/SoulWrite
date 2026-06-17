import { z } from 'zod'
import { anthropic } from './anthropic'
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
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system:
        'You are a personality analysis assistant. Extract structured personality profiles from chat content. Respond with valid JSON only, matching the requested schema exactly.',
      messages: [
        {
          role: 'user',
          content: personalityExtractionPrompt(name, content),
        },
      ],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
    if (!raw) {
      throw new Error('Empty response from Anthropic')
    }

    const parsed = JSON.parse(raw)
    return personalityProfileSchema.parse(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to extract personality: ${message}`)
  }
}
