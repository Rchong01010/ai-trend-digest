'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface EmailSignupProps {
  buttonText?: string
}

export function EmailSignup({ buttonText = 'Get the digest' }: EmailSignupProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      setStatus('success')
      setMessage(data.message || 'Redirecting to setup...')
      setEmail('')

      // Redirect to onboarding if not completed, otherwise dashboard
      if (data.userId && !data.onboarding_completed) {
        setTimeout(() => {
          router.push(`/onboarding?user=${data.userId}`)
        }, 500)
      } else if (data.userId) {
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
      }
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          disabled={status === 'loading' || status === 'success'}
          className="flex-1 px-4 py-3 bg-surface-elevated border border-border rounded-lg
                     text-text-primary placeholder:text-text-muted
                     focus:outline-none focus:ring-2 focus:ring-electric focus:border-transparent
                     disabled:opacity-50 transition-all"
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="px-6 py-3 bg-electric hover:bg-electric-dark text-white font-medium
                     rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Subscribing...
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Subscribed!
            </>
          ) : (
            buttonText
          )}
        </button>
      </div>

      {message && (
        <div
          className={`mt-3 flex items-center gap-2 text-sm ${
            status === 'success' ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {status === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {message}
        </div>
      )}

      <p className="mt-3 text-xs text-text-muted">
        Free forever. Unsubscribe anytime. No spam, we promise.
      </p>
    </form>
  )
}
