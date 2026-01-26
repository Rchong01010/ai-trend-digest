'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Target } from 'lucide-react'
import { DEFAULT_PREFERENCES } from '@/lib/supabase'

function TrackingBadgeContent() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('user')
  const [topics, setTopics] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchTopics()
    } else {
      setTopics(DEFAULT_PREFERENCES.topics.slice(0, 3))
      setIsLoading(false)
    }
  }, [userId])

  const fetchTopics = async () => {
    try {
      const response = await fetch(`/api/user/preferences?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setTopics(data.preferences?.topics || DEFAULT_PREFERENCES.topics)
      }
    } catch {
      setTopics(DEFAULT_PREFERENCES.topics)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return null
  }

  const displayTopics = topics.slice(0, 3)
  const hasMore = topics.length > 3

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-full text-xs text-text-secondary">
      <Target className="w-3 h-3 text-electric" />
      <span>Tracking:</span>
      <span className="text-text-primary">
        {displayTopics.join(', ')}
        {hasMore && ` +${topics.length - 3} more`}
      </span>
    </div>
  )
}

export function TrackingBadge() {
  return (
    <Suspense fallback={null}>
      <TrackingBadgeContent />
    </Suspense>
  )
}
