'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, ArrowLeft, Save, Plus, X, Check, Loader2, Lock, Crown } from 'lucide-react'
import { ContentStyle, DEFAULT_PREFERENCES, UserPreferences } from '@/lib/supabase'
import { PLANS } from '@/lib/stripe'

const SUBREDDIT_OPTIONS = [
  { id: 'LocalLLaMA', label: 'r/LocalLLaMA' },
  { id: 'MachineLearning', label: 'r/MachineLearning' },
  { id: 'artificial', label: 'r/artificial' },
  { id: 'ClaudeAI', label: 'r/ClaudeAI' },
  { id: 'ChatGPT', label: 'r/ChatGPT' },
  { id: 'StableDiffusion', label: 'r/StableDiffusion' },
  { id: 'singularity', label: 'r/singularity' },
  { id: 'OpenAI', label: 'r/OpenAI' },
  { id: 'Bard', label: 'r/Bard' },
]

const CONTENT_STYLES: { id: ContentStyle; label: string; description: string; proOnly?: boolean }[] = [
  { id: 'tiktok', label: 'TikTok', description: 'Fast-paced, hook-driven, 30-45 sec scripts' },
  { id: 'youtube', label: 'YouTube', description: 'More detailed explanations, longer format', proOnly: true },
  { id: 'linkedin', label: 'LinkedIn', description: 'Professional tone, business-focused insights', proOnly: true },
  { id: 'twitter', label: 'Twitter/X', description: 'Punchy takes, thread-style breakdowns', proOnly: true },
  { id: 'newsletter', label: 'Newsletter', description: 'Substack/Beehiiv style, 150-200 word paragraphs', proOnly: true },
]

const TIMEZONES = [
  { id: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { id: 'America/Denver', label: 'Mountain Time (MT)' },
  { id: 'America/Chicago', label: 'Central Time (CT)' },
  { id: 'America/New_York', label: 'Eastern Time (ET)' },
  { id: 'Europe/London', label: 'London (GMT/BST)' },
  { id: 'Europe/Paris', label: 'Central Europe (CET)' },
  { id: 'Asia/Tokyo', label: 'Japan (JST)' },
  { id: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { id: 'Australia/Sydney', label: 'Sydney (AEST)' },
]

function SettingsContent() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('user')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [errorIsUpgradeable, setErrorIsUpgradeable] = useState(false)
  const [userTier, setUserTier] = useState<'free' | 'pro'>('free')

  // Form state
  const [topics, setTopics] = useState<string[]>(DEFAULT_PREFERENCES.topics)
  const [newTopic, setNewTopic] = useState('')
  const [subreddits, setSubreddits] = useState<string[]>(DEFAULT_PREFERENCES.subreddits)
  const [trustedAuthors, setTrustedAuthors] = useState<string[]>([])
  const [newAuthor, setNewAuthor] = useState('')
  const [contentStyle, setContentStyle] = useState<ContentStyle>('tiktok')
  const [digestTime, setDigestTime] = useState('07:00')
  const [timezone, setTimezone] = useState('America/Los_Angeles')

  useEffect(() => {
    if (userId) {
      fetchPreferences()
    } else {
      setIsLoading(false)
      setError('No user ID provided. Please sign in again.')
    }
  }, [userId])

  const fetchPreferences = async () => {
    try {
      const response = await fetch(`/api/user/preferences?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch preferences')

      const data = await response.json()
      const prefs: UserPreferences = data.preferences || DEFAULT_PREFERENCES

      setTopics(prefs.topics || DEFAULT_PREFERENCES.topics)
      setSubreddits(prefs.subreddits || DEFAULT_PREFERENCES.subreddits)
      setTrustedAuthors(prefs.trusted_authors || [])
      setContentStyle(prefs.content_style || 'tiktok')
      setDigestTime(prefs.digest_time || '07:00')
      setTimezone(data.timezone || 'America/Los_Angeles')
      setUserTier(data.subscription_tier || 'free')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async () => {
    if (!userId) return

    setIsUpgrading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) throw new Error('Failed to create checkout session')

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start upgrade')
    } finally {
      setIsUpgrading(false)
    }
  }

  const isFeatureLocked = (feature: 'style' | 'topics' | 'digestTime', value?: string | number): boolean => {
    if (userTier === 'pro') return false

    if (feature === 'style' && value) {
      const style = CONTENT_STYLES.find(s => s.id === value)
      return style?.proOnly || false
    }

    if (feature === 'topics' && typeof value === 'number') {
      return value > PLANS.free.limits.topics
    }

    if (feature === 'digestTime') {
      return !PLANS.free.limits.customDigestTime
    }

    return false
  }

  const handleSave = async () => {
    if (!userId) return

    setIsSaving(true)
    setSaveStatus('idle')

    try {
      const preferences: UserPreferences = {
        topics,
        subreddits,
        trusted_authors: trustedAuthors,
        digest_time: digestTime,
        content_style: contentStyle,
      }

      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, preferences, timezone }),
      })

      if (!response.ok) throw new Error('Failed to save')

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      setSaveStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const addTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      if (isFeatureLocked('topics', topics.length + 1)) {
        setError(`Free plan limited to ${PLANS.free.limits.topics} topics.`)
        setErrorIsUpgradeable(true)
        return
      }
      setTopics([...topics, newTopic.trim()])
      setNewTopic('')
      setError(null)
      setErrorIsUpgradeable(false)
    }
  }

  const removeTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic))
  }

  const addAuthor = () => {
    const author = newAuthor.trim().replace('@', '')
    if (author && !trustedAuthors.includes(author)) {
      setTrustedAuthors([...trustedAuthors, author])
      setNewAuthor('')
    }
  }

  const removeAuthor = (author: string) => {
    setTrustedAuthors(trustedAuthors.filter(a => a !== author))
  }

  const toggleSubreddit = (id: string) => {
    setSubreddits(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-electric" />
      </main>
    )
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-text-primary mb-2">Sign in required</h1>
          <p className="text-text-secondary mb-4">Please sign up or sign in to access settings.</p>
          <Link href="/" className="text-electric hover:text-electric-dark">
            Go to homepage
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-border bg-surface-elevated">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-electric" />
            <span className="font-semibold text-text-primary">Settings</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between gap-4">
            <span className="text-red-400">{error}</span>
            {errorIsUpgradeable && userTier === 'free' && (
              <button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isUpgrading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Crown className="w-3 h-3" />
                )}
                Upgrade to Pro
              </button>
            )}
          </div>
        )}

        {/* Topics Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Topics to Track</h2>
          <div className="bg-surface-elevated border border-border rounded-xl p-5">
            <div className="flex flex-wrap gap-2 mb-4">
              {topics.map(topic => (
                <span
                  key={topic}
                  className="px-3 py-1.5 bg-electric/10 border border-electric/30 rounded-full text-sm text-electric flex items-center gap-2"
                >
                  {topic}
                  <button onClick={() => removeTopic(topic)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                placeholder="Add a topic (e.g., 'computer vision')"
                className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-electric"
              />
              <button
                onClick={addTopic}
                className="px-4 py-2 bg-electric hover:bg-electric-dark text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Subreddits Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Subreddits to Scan</h2>
          <div className="bg-surface-elevated border border-border rounded-xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUBREDDIT_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => toggleSubreddit(option.id)}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    subreddits.includes(option.id)
                      ? 'border-electric bg-electric/10 text-text-primary'
                      : 'border-border hover:border-text-muted text-text-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      subreddits.includes(option.id)
                        ? 'bg-electric border-electric'
                        : 'border-border'
                    }`}>
                      {subreddits.includes(option.id) && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                    <span className="text-sm">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Trusted Authors Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Trusted Authors</h2>
          <p className="text-text-secondary text-sm mb-4">
            Content from these accounts gets a 2x boost in your digest rankings.
          </p>
          <div className="bg-surface-elevated border border-border rounded-xl p-5">
            {trustedAuthors.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {trustedAuthors.map(author => (
                  <span
                    key={author}
                    className="px-3 py-1.5 bg-surface border border-border rounded-full text-sm text-text-primary flex items-center gap-2"
                  >
                    @{author}
                    <button onClick={() => removeAuthor(author)} className="text-text-muted hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAuthor()}
                placeholder="@username (e.g., @karpathy)"
                className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-electric"
              />
              <button
                onClick={addAuthor}
                className="px-4 py-2 bg-electric hover:bg-electric-dark text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Content Style Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Content Style</h2>
          <div className="bg-surface-elevated border border-border rounded-xl p-5">
            <div className="grid sm:grid-cols-2 gap-3">
              {CONTENT_STYLES.map(style => {
                const locked = isFeatureLocked('style', style.id)
                return (
                  <button
                    key={style.id}
                    onClick={() => {
                      if (locked) {
                        setError('This content style is only available on Pro.')
                        setErrorIsUpgradeable(true)
                        return
                      }
                      setContentStyle(style.id)
                      setError(null)
                      setErrorIsUpgradeable(false)
                    }}
                    className={`p-3 rounded-lg border text-left transition-colors relative ${
                      contentStyle === style.id
                        ? 'border-electric bg-electric/10'
                        : locked
                        ? 'border-border opacity-60 cursor-not-allowed'
                        : 'border-border hover:border-text-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        contentStyle === style.id ? 'border-electric' : 'border-border'
                      }`}>
                        {contentStyle === style.id && (
                          <div className="w-2 h-2 rounded-full bg-electric" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-text-primary flex items-center gap-2">
                          {style.label}
                          {locked && <Lock className="w-3 h-3 text-text-muted" />}
                        </div>
                        <div className="text-xs text-text-muted">{style.description}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Delivery Time Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Delivery Time</h2>
            {isFeatureLocked('digestTime') && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-xs text-yellow-400">
                <Crown className="w-3 h-3" />
                Pro
              </span>
            )}
          </div>
          <div className={`bg-surface-elevated border border-border rounded-xl p-5 ${isFeatureLocked('digestTime') ? 'opacity-60' : ''}`}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Time</label>
                <input
                  type="time"
                  value={digestTime}
                  onChange={(e) => {
                    if (isFeatureLocked('digestTime')) {
                      setError('Custom delivery time is only available on Pro.')
                      setErrorIsUpgradeable(true)
                      return
                    }
                    setDigestTime(e.target.value)
                  }}
                  disabled={isFeatureLocked('digestTime')}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-electric disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-electric"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz.id} value={tz.id}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Upgrade to Pro Section */}
        {userTier === 'free' && (
          <section className="mb-8">
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Crown className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary mb-2">Upgrade to Pro</h3>
                  <p className="text-text-secondary text-sm mb-4">
                    Unlock unlimited topics, all content styles (YouTube, LinkedIn, Twitter, Newsletter), and custom delivery times.
                  </p>
                  <button
                    onClick={handleUpgrade}
                    disabled={isUpgrading}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4" />
                        Upgrade for $12/mo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              saveStatus === 'saved'
                ? 'bg-green-500 text-white'
                : saveStatus === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-electric hover:bg-electric-dark text-white'
            } disabled:opacity-50`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  )
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-electric" />
    </main>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SettingsContent />
    </Suspense>
  )
}
