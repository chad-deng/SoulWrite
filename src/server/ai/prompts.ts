export function personalityExtractionPrompt(name: string, content: string): string {
  return `Analyze the following chat messages involving ${name} and extract a detailed personality profile as structured JSON.

Chat Content:
"""
${content}
"""

Extract the following fields:
- communicationStyle: { tone, sentenceStructure, vocabularyLevel }
- commonPhrases: array of strings
- frequentTopics: array of strings
- relationshipDynamics: { affectionLevel, communicationPattern, insideJokes: array of strings }
- values: array of strings
- emotionalPatterns: { showsCare, handlesStress, sharesJoy }
- memories: array of strings

Respond ONLY with valid JSON matching this structure. Do not include markdown formatting or explanatory text.`
}
