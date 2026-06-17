import Anthropic from '@anthropic-ai/sdk'

function createAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }
  return new Anthropic({ apiKey })
}

// Lazy-load Anthropic client to avoid instantiation during Next.js build
// when ANTHROPIC_API_KEY may not be available
function createLazyAnthropic(): Anthropic {
  let client: Anthropic | undefined

  return new Proxy({} as Anthropic, {
    get(_, prop) {
      if (!client) {
        client = createAnthropicClient()
      }
      const value = (client as unknown as Record<string, unknown>)[prop as string]
      if (typeof value === 'function') {
        return value.bind(client)
      }
      return value
    },
  })
}

export const anthropic = createLazyAnthropic()
