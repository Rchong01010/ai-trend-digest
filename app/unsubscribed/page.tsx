'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, CheckCircle, XCircle } from 'lucide-react'

function UnsubscribedContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'
  const error = searchParams.get('error')

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="w-6 h-6 text-electric" />
          <span className="font-semibold text-text-primary text-lg">AI Trend Digest</span>
        </div>

        {success ? (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              You've been unsubscribed
            </h1>
            <p className="text-text-secondary mb-8">
              You will no longer receive digest emails from us. We're sorry to see you go!
            </p>
            <p className="text-text-muted text-sm mb-8">
              Changed your mind? You can always sign up again from our homepage.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              Something went wrong
            </h1>
            <p className="text-text-secondary mb-8">
              {error === 'invalid'
                ? 'The unsubscribe link is invalid or has expired.'
                : 'We couldn\'t process your unsubscribe request. Please try again or contact support.'}
            </p>
          </>
        )}

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-electric hover:text-electric-dark transition-colors"
        >
          Return to homepage
        </Link>
      </div>
    </main>
  )
}

export default function UnsubscribedPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading...</div>
      </main>
    }>
      <UnsubscribedContent />
    </Suspense>
  )
}
