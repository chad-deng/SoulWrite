import OpenAI from 'openai'

function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }
  return new OpenAI({ apiKey })
}

// Lazy-load OpenAI client to avoid instantiation during Next.js build
// when OPENAI_API_KEY may not be available
function createLazyOpenAI(): OpenAI {
  let client: OpenAI | undefined

  return new Proxy({} as OpenAI, {
    get(_, prop) {
      if (!client) {
        client = createOpenAIClient()
      }
      const value = (client as unknown as Record<string, unknown>)[prop as string]
      if (typeof value === 'function') {
        return value.bind(client)
      }
      return value
    },
  })
}

export const openai = createLazyOpenAI()
