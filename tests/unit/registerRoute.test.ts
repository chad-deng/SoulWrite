import { vi } from 'vitest'

vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { describe, test, expect, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import { POST } from '@/app/api/register/route'
import { prisma } from '@/server/db'

const mockedFindUnique = vi.mocked(prisma.user.findUnique)
const mockedCreate = vi.mocked(prisma.user.create)

describe('POST /api/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createRequest(body: Record<string, unknown>) {
    return new Request('http://localhost:3001/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  test('creates user with gender, date of birth and default email channel', async () => {
    mockedFindUnique.mockResolvedValue(null)
    mockedCreate.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: null,
      gender: 'female',
      dateOfBirth: new Date('1990-05-15'),
      deliveryChannel: 'email',
      password: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Awaited<ReturnType<typeof prisma.user.create>>)

    const res = await POST(createRequest({
      email: 'test@example.com',
      password: 'secret123',
      name: 'Test User',
      gender: 'female',
      dateOfBirth: '1990-05-15',
    }))

    expect(res.status).toBe(201)
    expect(mockedCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'test@example.com',
        name: 'Test User',
        gender: 'female',
        dateOfBirth: new Date('1990-05-15'),
        deliveryChannel: 'email',
        password: expect.stringMatching(/^\$2[aby]\$/),
      }),
    })
  })

  test('creates user with explicit delivery channel', async () => {
    mockedFindUnique.mockResolvedValue(null)
    mockedCreate.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: null,
      gender: 'female',
      dateOfBirth: new Date('1990-05-15'),
      deliveryChannel: 'wechat',
      password: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Awaited<ReturnType<typeof prisma.user.create>>)

    const res = await POST(createRequest({
      email: 'test@example.com',
      password: 'secret123',
      name: 'Test User',
      gender: 'female',
      dateOfBirth: '1990-05-15',
      deliveryChannel: 'wechat',
    }))

    expect(res.status).toBe(201)
    expect(mockedCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        deliveryChannel: 'wechat',
      }),
    })
  })

  test('rejects invalid gender', async () => {
    const res = await POST(createRequest({
      email: 'test@example.com',
      password: 'secret123',
      gender: 'invalid',
      dateOfBirth: '1990-05-15',
    }))

    expect(res.status).toBe(400)
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  test('rejects malformed date of birth', async () => {
    const res = await POST(createRequest({
      email: 'test@example.com',
      password: 'secret123',
      gender: 'female',
      dateOfBirth: '05/15/1990',
    }))

    expect(res.status).toBe(400)
    expect(mockedCreate).not.toHaveBeenCalled()
  })
})
