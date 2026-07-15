import { useState, useCallback } from 'react'

interface UploadResult {
  url: string
  contentType: string
  size: number
  name: string
}

interface UseFileUploadReturn {
  uploadFile: (file: File) => Promise<UploadResult>
  isUploading: boolean
  error: string
  progress: string
}

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true)
    setError('')
    setProgress('Uploading...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Upload failed')
      }

      const result = (await response.json()) as UploadResult
      setProgress('Upload complete!')
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(message)
      setProgress('')
      throw err
    } finally {
      setIsUploading(false)
    }
  }, [])

  return { uploadFile, isUploading, error, progress }
}
