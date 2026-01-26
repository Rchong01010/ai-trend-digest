'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Check, FileText } from 'lucide-react'

interface ScriptSectionProps {
  script: string | null
}

export function ScriptSection({ script }: ScriptSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!script) return null

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-3 border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-surface hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
          <FileText className="w-4 h-4" />
          TikTok Script
        </div>
        <div className="flex items-center gap-2">
          {isOpen && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-surface-elevated hover:bg-border rounded transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-green-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 py-4 bg-surface-elevated border-t border-border">
          <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
            {script}
          </div>
        </div>
      )}
    </div>
  )
}
