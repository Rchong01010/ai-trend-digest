import { Cpu, Wrench, BookOpen, Flame, Sparkles, ExternalLink, Settings, AlertTriangle, RefreshCw } from 'lucide-react'
import { supabaseAdmin, Trend } from '@/lib/supabase'
import { ScriptSection } from '@/components/dashboard/ScriptSection'
import { RefreshButton } from '@/components/dashboard/RefreshButton'
import { ScanButton } from '@/components/dashboard/ScanButton'
import { TrackingBadge } from '@/components/dashboard/TrackingBadge'
import { SettingsLink } from '@/components/dashboard/SettingsLink'
import Link from 'next/link'

const categoryIcons: Record<string, React.ReactNode> = {
  models: <Cpu className="w-4 h-4" />,
  tools: <Wrench className="w-4 h-4" />,
  research: <BookOpen className="w-4 h-4" />,
  drama: <Flame className="w-4 h-4" />,
  tutorials: <Sparkles className="w-4 h-4" />,
}

const categoryColors: Record<string, string> = {
  models: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  tools: 'bg-green-500/20 text-green-400 border-green-500/30',
  research: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  drama: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  tutorials: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
}

interface DashboardData {
  trends: Trend[]
  error?: string
}

async function getTodaysTrends(): Promise<DashboardData> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data: trends, error } = await supabaseAdmin
      .from('trends')
      .select('*')
      .eq('date', today)
      .order('engagement_score', { ascending: false })

    if (error) {
      console.error('Failed to fetch trends:', error)
      return { trends: [], error: 'Failed to load trends. Please try again.' }
    }

    return { trends: trends || [] }
  } catch (err) {
    console.error('Dashboard error:', err)
    return { trends: [], error: 'Something went wrong. Please try again.' }
  }
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { trends, error } = await getTodaysTrends()
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-border bg-surface-elevated">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-electric" />
              <span className="font-semibold text-text-primary">AI Trend Digest</span>
            </Link>
            <TrackingBadge />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted hidden sm:block">{today}</span>
            <SettingsLink />
            <RefreshButton />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              {error}
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-electric hover:bg-electric-dark text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </a>
          </div>
        ) : trends.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-elevated flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              No trends yet today
            </h2>
            <p className="text-text-secondary mb-6">
              The scanner runs at 6am PT. Check back later or trigger a manual scan.
            </p>
            <ScanButton />
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Today's AI Trends
              </h1>
              <p className="text-text-secondary">
                {trends.length} trends from across the web
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {trends.map((trend) => (
                <div
                  key={trend.id}
                  className="bg-surface-elevated border border-border rounded-xl p-5 card-hover"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${categoryColors[trend.category]}`}>
                      {categoryIcons[trend.category]}
                      {trend.category}
                    </span>
                    <span className="text-xs text-text-muted">
                      Score: {trend.engagement_score}
                    </span>
                  </div>

                  <h3 className="font-semibold text-text-primary text-lg mb-2">
                    {trend.title}
                  </h3>

                  <p className="text-text-secondary text-sm leading-relaxed mb-3">
                    {trend.summary}
                  </p>

                  {trend.why_it_matters && (
                    <p className="text-sm text-text-muted mb-3">
                      <span className="font-medium text-text-secondary">Why it matters:</span>{' '}
                      {trend.why_it_matters}
                    </p>
                  )}

                  {trend.tiktok_angle && (
                    <div className="px-3 py-2 bg-accent/10 rounded-lg border border-accent/20 mb-3">
                      <p className="text-sm text-accent">
                        <span className="font-medium">Content angle:</span> {trend.tiktok_angle}
                      </p>
                    </div>
                  )}

                  {/* Collapsible Script Section */}
                  <ScriptSection script={trend.script} />

                  {trend.sources && trend.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {trend.sources.slice(0, 3).map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-electric hover:text-electric-dark transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {source.platform || 'Source'}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
