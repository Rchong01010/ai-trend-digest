'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ScanButtonProps {
  variant?: 'primary' | 'secondary'
  label?: string
  loadingLabel?: string
}

export function ScanButton({
  variant = 'primary',
  label = 'Run Scanner',
  loadingLabel = 'Scanning...',
}: ScanButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleScan = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Scan failed')
      }

      const data = await response.json()
      console.log('Scan complete:', data)

      // Refresh the page to show new trends
      router.refresh()
    } catch (err) {
      console.error('Scan error:', err)
      setError(err instanceof Error ? err.message : 'Failed to scan')
    } finally {
      setIsLoading(false)
    }
  }

  const baseStyles = "inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  const variantStyles = variant === 'primary'
    ? "bg-electric hover:bg-electric-dark text-white"
    : "bg-surface hover:bg-surface-hover border border-border text-text-primary"

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleScan}
        disabled={isLoading}
        className={`${baseStyles} ${variantStyles}`}
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? loadingLabel : label}
      </button>
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  )
}
