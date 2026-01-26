'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { ContentStyle, DEFAULT_PREFERENCES } from '@/lib/supabase'

const TOPIC_OPTIONS = [
  { id: 'ai', label: 'AI & Machine Learning', keywords: ['AI', 'machine learning', 'LLM', 'neural network'] },
  { id: 'llm', label: 'Large Language Models', keywords: ['GPT', 'Claude', 'Llama', 'LLM', 'chatbot'] },
  { id: 'image', label: 'Image & Video AI', keywords: ['Midjourney', 'Stable Diffusion', 'DALL-E', 'Sora'] },
  { id: 'coding', label: 'AI Coding Tools', keywords: ['Copilot', 'Cursor', 'code generation', 'programming'] },
  { id: 'robotics', label: 'Robotics & Embodied AI', keywords: ['robotics', 'autonomous', 'self-driving'] },
  { id: 'research', label: 'AI Research & Papers', keywords: ['research', 'paper', 'arxiv', 'benchmark'] },
  { id: 'business', label: 'AI Business & Startups', keywords: ['startup', 'funding', 'enterprise', 'business'] },
  { id: 'ethics', label: 'AI Safety & Ethics', keywords: ['safety', 'alignment', 'ethics', 'regulation'] },
]

const SUBREDDIT_OPTIONS = [
  { id: 'LocalLLaMA', label: 'r/LocalLLaMA', description: 'Running AI models locally' },
  { id: 'MachineLearning', label: 'r/MachineLearning', description: 'ML research & discussion' },
  { id: 'artificial', label: 'r/artificial', description: 'General AI news' },
  { id: 'ClaudeAI', label: 'r/ClaudeAI', description: 'Claude & Anthropic' },
  { id: 'ChatGPT', label: 'r/ChatGPT', description: 'ChatGPT & OpenAI' },
  { id: 'StableDiffusion', label: 'r/StableDiffusion', description: 'Image generation' },
  { id: 'singularity', label: 'r/singularity', description: 'AGI & future of AI' },
]

const CONTENT_STYLES: { id: ContentStyle; label: string; description: string }[] = [
  { id: 'tiktok', label: 'TikTok', description: 'Fast-paced, hook-driven, 30-45 sec scripts' },
  { id: 'youtube', label: 'YouTube', description: 'More detailed explanations, longer format' },
  { id: 'linkedin', label: 'LinkedIn', description: 'Professional tone, business-focused insights' },
  { id: 'twitter', label: 'Twitter/X', description: 'Punchy takes, thread-style breakdowns' },
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

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('user')

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['ai', 'llm'])
  const [customTopic, setCustomTopic] = useState('')
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>(['LocalLLaMA', 'MachineLearning', 'artificial'])
  const [contentStyle, setContentStyle] = useState<ContentStyle>('tiktok')
  const [digestTime, setDigestTime] = useState('07:00')
  const [timezone, setTimezone] = useState('America/Los_Angeles')

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const toggleSubreddit = (id: string) => {
    setSelectedSubreddits(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const addCustomTopic = () => {
    if (customTopic.trim() && !selectedTopics.includes(customTopic.trim())) {
      setSelectedTopics(prev => [...prev, customTopic.trim()])
      setCustomTopic('')
    }
  }

  const handleSubmit = async () => {
    if (!userId) {
      setError('Missing user ID. Please sign up again.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    // Build topics array from selections
    const topicKeywords = selectedTopics.flatMap(id => {
      const option = TOPIC_OPTIONS.find(o => o.id === id)
      return option ? option.keywords : [id] // Custom topics use the string directly
    })

    const preferences = {
      topics: Array.from(new Set(topicKeywords)), // Dedupe
      subreddits: selectedSubreddits,
      trusted_authors: [],
      digest_time: digestTime,
      content_style: contentStyle,
    }

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          preferences,
          timezone,
          onboarding_completed: true,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save preferences')
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-electric" />
            <span className="text-2xl font-bold text-text-primary">AI Trend Digest</span>
          </div>
          <p className="text-text-secondary">Let's personalize your digest</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s === step ? 'bg-electric' : s < step ? 'bg-green-500' : 'bg-surface-hover'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-surface-elevated border border-border rounded-xl p-6">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                What topics do you want to track?
              </h2>
              <p className="text-text-secondary text-sm mb-6">
                Select the AI topics you want in your digest. We'll find trending content about these.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {TOPIC_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => toggleTopic(option.id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedTopics.includes(option.id)
                        ? 'border-electric bg-electric/10 text-text-primary'
                        : 'border-border hover:border-text-muted text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        selectedTopics.includes(option.id)
                          ? 'bg-electric border-electric'
                          : 'border-border'
                      }`}>
                        {selectedTopics.includes(option.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTopic()}
                  placeholder="Add custom topic..."
                  className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-electric"
                />
                <button
                  onClick={addCustomTopic}
                  className="px-4 py-2 bg-surface-hover border border-border rounded-lg text-text-primary hover:bg-surface transition-colors"
                >
                  Add
                </button>
              </div>

              {selectedTopics.filter(t => !TOPIC_OPTIONS.find(o => o.id === t)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedTopics
                    .filter(t => !TOPIC_OPTIONS.find(o => o.id === t))
                    .map(topic => (
                      <span
                        key={topic}
                        className="px-3 py-1 bg-electric/10 border border-electric/30 rounded-full text-sm text-electric flex items-center gap-2"
                      >
                        {topic}
                        <button
                          onClick={() => setSelectedTopics(prev => prev.filter(t => t !== topic))}
                          className="hover:text-white"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                </div>
              )}

              <h3 className="text-lg font-medium text-text-primary mt-8 mb-4">
                Which subreddits should we scan?
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {SUBREDDIT_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => toggleSubreddit(option.id)}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      selectedSubreddits.includes(option.id)
                        ? 'border-electric bg-electric/10'
                        : 'border-border hover:border-text-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedSubreddits.includes(option.id)
                          ? 'bg-electric border-electric'
                          : 'border-border'
                      }`}>
                        {selectedSubreddits.includes(option.id) && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">{option.label}</div>
                        <div className="text-xs text-text-muted">{option.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                What's your content style?
              </h2>
              <p className="text-text-secondary text-sm mb-6">
                We'll write scripts optimized for your platform of choice.
              </p>

              <div className="grid gap-3">
                {CONTENT_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setContentStyle(style.id)}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      contentStyle === style.id
                        ? 'border-electric bg-electric/10'
                        : 'border-border hover:border-text-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        contentStyle === style.id
                          ? 'border-electric'
                          : 'border-border'
                      }`}>
                        {contentStyle === style.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-electric" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">{style.label}</div>
                        <div className="text-sm text-text-muted">{style.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                When do you want your digest?
              </h2>
              <p className="text-text-secondary text-sm mb-6">
                We'll send your personalized AI trends at this time every day.
              </p>

              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Delivery Time
                  </label>
                  <input
                    type="time"
                    value={digestTime}
                    onChange={(e) => setDigestTime(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-electric"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-electric"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.id} value={tz.id}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-6 py-2 bg-electric hover:bg-electric-dark text-white rounded-lg transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-electric hover:bg-electric-dark text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Finish Setup'}
              <Check className="w-4 h-4" />
            </button>
          )}
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

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OnboardingContent />
    </Suspense>
  )
}
