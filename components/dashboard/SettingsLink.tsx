'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Settings } from 'lucide-react'

function SettingsLinkContent() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('user')

  if (!userId) {
    return null
  }

  return (
    <Link
      href={`/settings?user=${userId}`}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary border border-border hover:border-text-muted rounded-lg transition-colors"
    >
      <Settings className="w-4 h-4" />
      Settings
    </Link>
  )
}

export function SettingsLink() {
  return (
    <Suspense fallback={null}>
      <SettingsLinkContent />
    </Suspense>
  )
}
