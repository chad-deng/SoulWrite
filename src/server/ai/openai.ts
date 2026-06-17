import OpenAI from 'openai'

function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }
  const baseURL = process.env.OPENAI_BASE_URL
  return new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })
}

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
