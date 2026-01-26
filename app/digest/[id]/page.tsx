import { notFound } from 'next/navigation'
import { Cpu, Wrench, BookOpen, Flame, Sparkles, ExternalLink } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

const categoryIcons: Record<string, React.ReactNode> = {
  models: <Cpu className="w-4 h-4" />,
  tools: <Wrench className="w-4 h-4" />,
  research: <BookOpen className="w-4 h-4" />,
  drama: <Flame className="w-4 h-4" />,
  tutorials: <Sparkles className="w-4 h-4" />,
}

const categoryColors: Record<string, string> = {
  models: 'bg-blue-500/20 text-blue-400',
  tools: 'bg-green-500/20 text-green-400',
  research: 'bg-purple-500/20 text-purple-400',
  drama: 'bg-orange-500/20 text-orange-400',
  tutorials: 'bg-pink-500/20 text-pink-400',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DigestPage({ params }: PageProps) {
  const { id } = await params

  // Fetch the digest
  const { data: digest, error: digestError } = await supabaseAdmin
    .from('digests')
    .select('*')
    .eq('id', id)
    .single()

  if (digestError || !digest) {
    notFound()
  }

  // Mark as opened
  await supabaseAdmin
    .from('digests')
    .update({ opened: true })
    .eq('id', id)

  // Fetch the trends included in this digest
  const { data: trends } = await supabaseAdmin
    .from('trends')
    .select('*')
    .in('id', digest.trends_included || [])
    .order('engagement_score', { ascending: false })

  const digestDate = new Date(digest.sent_at).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-border bg-surface-elevated">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-electric" />
            <span className="font-semibold text-text-primary">AI Trend Digest</span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Your Daily AI Digest
          </h1>
          <p className="text-text-muted">{digestDate}</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-lg text-text-secondary mb-8">
          Here's what happened in AI while you were sleeping:
        </p>

        {trends && trends.length > 0 ? (
          <div className="space-y-6">
            {trends.map((trend) => (
              <div
                key={trend.id}
                className="bg-surface-elevated border border-border rounded-xl p-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${categoryColors[trend.category]}`}>
                    {categoryIcons[trend.category]}
                    {trend.category}
                  </span>
                </div>

                <h2 className="font-semibold text-text-primary text-xl mb-3">
                  {trend.title}
                </h2>

                <p className="text-text-secondary leading-relaxed mb-4">
                  {trend.summary}
                </p>

                {trend.why_it_matters && (
                  <p className="text-text-muted mb-4">
                    <span className="font-medium text-text-secondary">Why it matters:</span>{' '}
                    {trend.why_it_matters}
                  </p>
                )}

                {trend.tiktok_angle && (
                  <div className="px-4 py-3 bg-accent/10 rounded-lg border border-accent/20 mb-4">
                    <p className="text-accent">
                      <span className="font-medium">Content angle:</span> {trend.tiktok_angle}
                    </p>
                  </div>
                )}

                {trend.sources && trend.sources.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
                    {trend.sources.map((source: { url: string; platform: string; title?: string }, idx: number) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-electric hover:text-electric-dark transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {source.title || source.platform || 'Source'}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-center py-8">
            No trends found for this digest.
          </p>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-text-muted mb-4">
            Want this in your inbox every morning?
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-electric hover:bg-electric-dark text-white font-medium rounded-lg transition-colors"
          >
            Subscribe for free
          </Link>
        </div>
      </div>
    </main>
  )
}
