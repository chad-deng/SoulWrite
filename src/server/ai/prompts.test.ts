import { describe, expect, it } from 'vitest'

import { letterGenerationPrompt } from './prompts'

describe('letterGenerationPrompt', () => {
  it('includes the deceased name and relationship', () => {
    const prompt = letterGenerationPrompt({
      deceasedName: 'Rose',
      relationship: 'grandmother',
      personalityJson: '{}',
      tone: 'comforting',
    })

    expect(prompt).toContain('逝者姓名：Rose')
    expect(prompt).toContain('逝者身份：grandmother')
  })

  it('uses the recipient nickname when provided', () => {
    const prompt = letterGenerationPrompt({
      deceasedName: 'Rose',
      relationship: 'grandmother',
      recipientNickname: '小皮猴',
      personalityJson: '{}',
      tone: 'comforting',
    })

    expect(prompt).toContain('逝者对收信人的昵称：小皮猴')
    expect(prompt).toContain('称呼对方为"小皮猴"')
    expect(prompt).not.toContain('称呼对方为"孩子"')
  })

  it('falls back to 孩子 for grandmother without nickname', () => {
    const prompt = letterGenerationPrompt({
      deceasedName: 'Rose',
      relationship: 'grandmother',
      personalityJson: '{}',
      tone: 'comforting',
    })

    expect(prompt).toContain('称呼对方为"孩子"')
  })

  it('includes today’s date and weather when provided', () => {
    const prompt = letterGenerationPrompt({
      deceasedName: 'Rose',
      relationship: 'grandmother',
      personalityJson: '{}',
      tone: 'comforting',
      currentContext: 'Shanghai',
      weather: {
        location: 'Shanghai',
        description: '多云',
        temperature: 24,
      },
    })

    expect(prompt).toContain('逝者所在城市：Shanghai')
    expect(prompt).toContain('当地天气（Shanghai）：多云，24°C')
    expect(prompt).toContain('今天日期')
  })

  it('includes recent life updates and photo hints', () => {
    const prompt = letterGenerationPrompt({
      deceasedName: 'Rose',
      relationship: 'grandmother',
      personalityJson: '{}',
      tone: 'comforting',
      recentUpdates: [
        {
          content: 'Started a new garden.',
          imageUrl: 'http://example.com/photo.jpg',
          createdAt: new Date(),
        },
        {
          content: 'Graduated last week.',
          imageUrl: null,
          createdAt: new Date(),
        },
      ],
    })

    expect(prompt).toContain('收信人最近分享的生活动态：')
    expect(prompt).toContain('Started a new garden. [附照片]')
    expect(prompt).toContain('Graduated last week.')
  })

  it('does not address the recipient as the deceased', () => {
    const prompt = letterGenerationPrompt({
      deceasedName: 'Rose',
      relationship: 'grandmother',
      personalityJson: '{}',
      tone: 'comforting',
    })

    expect(prompt).toContain('绝不要称呼收信人为"Rose"或"grandmother"')
  })
})
