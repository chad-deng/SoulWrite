import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, MP4, WebM, MOV' },
      { status: 400 }
    )
  }

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const pathname = `uploads/${session.user.id}/${timestamp}-${safeName}`

  const blob = await put(pathname, file, {
    access: 'public',
  })

  return NextResponse.json({
    url: blob.url,
    contentType: file.type,
    size: file.size,
    name: file.name,
  })
}
