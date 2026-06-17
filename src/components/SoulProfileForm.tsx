'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Users,
  Heart,
  Baby,
  HeartHandshake,
  ChevronDown,
  MapPin,
} from 'lucide-react'

import { trpc } from '@/trpc/provider'

type RelationshipOption = {
  value: string
  label: string
  icon: React.ReactNode
}

const RELATIONSHIPS: RelationshipOption[] = [
  { value: 'grandmother', label: 'Grandmother', icon: <User className="h-5 w-5" /> },
  { value: 'grandfather', label: 'Grandfather', icon: <User className="h-5 w-5" /> },
  { value: 'mother', label: 'Mother', icon: <Heart className="h-5 w-5" /> },
  { value: 'father', label: 'Father', icon: <User className="h-5 w-5" /> },
  { value: 'sister', label: 'Sister', icon: <User className="h-5 w-5" /> },
  { value: 'brother', label: 'Brother', icon: <User className="h-5 w-5" /> },
  { value: 'aunt', label: 'Aunt', icon: <User className="h-5 w-5" /> },
  { value: 'uncle', label: 'Uncle', icon: <User className="h-5 w-5" /> },
  { value: 'cousin', label: 'Cousin', icon: <Users className="h-5 w-5" /> },
  { value: 'friend', label: 'Friend', icon: <HeartHandshake className="h-5 w-5" /> },
  { value: 'partner', label: 'Partner', icon: <Heart className="h-5 w-5" /> },
  { value: 'spouse', label: 'Spouse', icon: <Heart className="h-5 w-5" /> },
  { value: 'child', label: 'Child', icon: <Baby className="h-5 w-5" /> },
  { value: 'other', label: 'Other', icon: <User className="h-5 w-5" /> },
]

export function SoulProfileForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [location, setLocation] = useState('')
  const [recipientNickname, setRecipientNickname] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('')

  const createProfile = trpc.soulProfile.create.useMutation({
    onSuccess: (data) => {
      router.push(`/soul-profile/${data.id}`)
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  const selected = RELATIONSHIPS.find((r) => r.value === relationship)

  const handleSelect = (value: string) => {
    setRelationship(value)
    setIsOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !relationship) {
      setError('Please enter a name and select a relationship')
      return
    }

    createProfile.mutate({
      name: name.trim(),
      relationship,
      location: location.trim() || undefined,
      recipientNickname: recipientNickname.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="rounded bg-red-50 p-3 text-base text-red-600">{error}</p>}
      <div>
        <label className="block text-base font-medium text-slate-700">Their Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-2 w-full rounded border border-slate-300 px-3 py-2.5 text-base focus:border-slate-500 focus:outline-none"
          placeholder="e.g., Grandma Rose"
        />
      </div>
      <div>
        <label className="block text-base font-medium text-slate-700">Relationship</label>
        <div className="relative mt-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex w-full items-center justify-between rounded border border-slate-300 bg-white px-3 py-2.5 text-left text-base focus:border-slate-500 focus:outline-none"
          >
            <span className="flex items-center gap-3">
              {selected ? (
                <>
                  <span className="text-slate-600">{selected.icon}</span>
                  <span>{selected.label}</span>
                </>
              ) : (
                <span className="text-slate-400">Select relationship</span>
              )}
            </span>
            <ChevronDown className="h-5 w-5 text-slate-500" />
          </button>
          {isOpen && (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-slate-300 bg-white py-1 shadow-lg">
              {RELATIONSHIPS.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-base hover:bg-slate-100"
                  >
                    <span className="text-slate-600">{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div>
        <label className="block text-base font-medium text-slate-700">Their Location</label>
        <div className="relative mt-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <MapPin className="h-5 w-5" />
          </span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded border border-slate-300 py-2.5 pl-10 pr-3 text-base focus:border-slate-500 focus:outline-none"
            placeholder="e.g., Shanghai (used for weather context)"
          />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Optional. Used to include local weather in letters.
        </p>
      </div>
      <div>
        <label className="block text-base font-medium text-slate-700">Their Nickname for You</label>
        <input
          type="text"
          value={recipientNickname}
          onChange={(e) => setRecipientNickname(e.target.value)}
          className="mt-2 w-full rounded border border-slate-300 px-3 py-2.5 text-base focus:border-slate-500 focus:outline-none"
          placeholder="e.g., 小皮猴 / 乖乖 / buddy"
        />
        <p className="mt-1 text-sm text-slate-500">
          Optional. The name Rose used to call you in letters.
        </p>
      </div>
      <button
        type="submit"
        disabled={createProfile.isPending}
        className="w-full rounded bg-slate-900 py-2.5 text-base font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {createProfile.isPending ? 'Creating...' : 'Create Profile'}
      </button>
    </form>
  )
}
