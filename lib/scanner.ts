import { analyzeTrends, TrendAnalysis, AnalyzeOptions } from './claude'
import {
  RawTrendData,
  ScoredTrend,
  rankTrends,
  RankingOptions,
  TRUSTED_AUTHORS,
} from './ranking-config'
import { ContentStyle } from './supabase'

export interface ScanOptions {
  subreddits?: string[]
  topics?: string[]
  trustedAuthors?: string[]
  contentStyle?: ContentStyle
}

export interface ScanResults {
  trends: TrendAnalysis[]
  sourceBreakdown: {
    hackerNews: number
    reddit: number
    bluesky: number
    twitter: number
    rss: number
    total: number
  }
}

interface HackerNewsStory {
  id: number
  title: string
  url?: string
  score: number
  descendants: number
  time: number
  by?: string
}

interface RedditPost {
  title: string
  url: string
  score: number
  num_comments: number
  subreddit: string
  permalink: string
  created_utc: number
  author: string
}

interface BlueskyPost {
  uri: string
  cid: string
  author: { handle: string; displayName?: string }
  record: { text: string; createdAt: string }
  likeCount?: number
  repostCount?: number
  replyCount?: number
}

// Fetch top AND new AI stories from Hacker News
async function fetchHackerNews(): Promise<RawTrendData[]> {
  try {
    // Get both top stories and new stories
    const [topStoriesRes, newStoriesRes] = await Promise.all([
      fetch('https://hacker-news.firebaseio.com/v0/topstories.json'),
      fetch('https://hacker-news.firebaseio.com/v0/newstories.json'),
    ])

    const topStoryIds: number[] = await topStoriesRes.json()
    const newStoryIds: number[] = await newStoriesRes.json()

    // Combine and dedupe, prioritizing top stories
    const allIds = Array.from(new Set([...topStoryIds.slice(0, 50), ...newStoryIds.slice(0, 30)]))

    // Fetch stories in batches to avoid overwhelming the API
    const storyPromises = allIds.slice(0, 70).map(async (id) => {
      const res = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`
      )
      return res.json() as Promise<HackerNewsStory>
    })

    const stories = await Promise.all(storyPromises)

    // Expanded AI keywords
    const aiKeywords = [
      'ai', 'gpt', 'llm', 'claude', 'openai', 'anthropic', 'gemini',
      'machine learning', 'neural', 'transformer', 'chatbot', 'language model',
      'diffusion', 'stable', 'midjourney', 'copilot', 'llama', 'mistral',
      'deepmind', 'hugging face', 'pytorch', 'tensorflow', 'cursor', 'ai agent',
      'chatgpt', 'grok', 'perplexity', 'artificial intelligence', 'deep learning'
    ]

    const aiStories = stories.filter(story =>
      story?.title && aiKeywords.some(keyword =>
        story.title.toLowerCase().includes(keyword)
      )
    )

    return aiStories.map(s => ({
      title: s.title,
      source: 'HackerNews',
      author: s.by,
      engagement: s.score,
      comments: s.descendants || 0,
      url: s.url,
      timestamp: new Date(s.time * 1000),
    }))
  } catch (error) {
    console.error('Failed to fetch HackerNews:', error)
    return []
  }
}

// Fetch from Reddit AI subreddits
async function fetchReddit(customSubreddits?: string[]): Promise<RawTrendData[]> {
  const subreddits = customSubreddits?.length
    ? customSubreddits
    : ['LocalLLaMA', 'MachineLearning', 'artificial', 'ClaudeAI', 'ChatGPT', 'OpenAI', 'StableDiffusion', 'singularity']
  const results: RawTrendData[] = []

  for (const subreddit of subreddits) {
    try {
      // Fetch both hot and top posts
      const [hotRes, topRes] = await Promise.all([
        fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=20`, {
          headers: { 'User-Agent': 'AI-Trend-Digest/1.0' },
        }),
        fetch(`https://www.reddit.com/r/${subreddit}/top.json?t=day&limit=10`, {
          headers: { 'User-Agent': 'AI-Trend-Digest/1.0' },
        }),
      ])

      const processPosts = async (res: Response) => {
        if (!res.ok) return []
        const data = await res.json()
        return data.data.children.map((child: { data: RedditPost }) => child.data)
      }

      const [hotPosts, topPosts] = await Promise.all([
        processPosts(hotRes),
        processPosts(topRes),
      ])

      // Combine and dedupe by permalink
      const seenPermalinks = new Set<string>()
      const allPosts = [...hotPosts, ...topPosts].filter((p: RedditPost) => {
        if (seenPermalinks.has(p.permalink)) return false
        seenPermalinks.add(p.permalink)
        return p.score > 30 // Lower threshold to get more content
      })

      const mappedPosts = allPosts.slice(0, 15).map((p: RedditPost) => ({
        title: p.title,
        source: `r/${subreddit}`,
        author: p.author,
        engagement: p.score,
        comments: p.num_comments,
        url: `https://reddit.com${p.permalink}`,
        timestamp: new Date(p.created_utc * 1000),
      }))

      results.push(...mappedPosts)
    } catch (error) {
      console.error(`Failed to fetch r/${subreddit}:`, error)
    }
  }

  return results
}

// Fetch from Bluesky with expanded search
async function fetchBluesky(): Promise<RawTrendData[]> {
  try {
    // Expanded search terms for better coverage
    const searchTerms = [
      'artificial intelligence',
      'ChatGPT',
      'Claude AI',
      'GPT-4',
      'LLM',
      'machine learning',
      'OpenAI',
      'Anthropic',
    ]
    const results: RawTrendData[] = []

    for (const term of searchTerms.slice(0, 4)) { // Process 4 terms
      try {
        const res = await fetch(
          `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(term)}&limit=30&sort=top`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'AI-Trend-Digest/1.0',
            },
          }
        )

        if (!res.ok) {
          console.log(`Bluesky search failed for "${term}": ${res.status}`)
          continue
        }

        const data = await res.json()
        const posts: BlueskyPost[] = data.posts || []

        // Lower threshold to capture more content
        const topPosts = posts
          .filter(p => (p.likeCount || 0) >= 5 || (p.repostCount || 0) >= 2)
          .slice(0, 8)
          .map(p => ({
            title: p.record.text.slice(0, 250),
            source: 'Bluesky',
            author: p.author.handle,
            engagement: (p.likeCount || 0) + (p.repostCount || 0) * 2 + (p.replyCount || 0),
            url: `https://bsky.app/profile/${p.author.handle}/post/${p.uri.split('/').pop()}`,
            timestamp: new Date(p.record.createdAt),
          }))

        results.push(...topPosts)
      } catch (err) {
        console.error(`Bluesky search error for "${term}":`, err)
        continue
      }
    }

    // Dedupe by URL
    const seen = new Set<string>()
    return results.filter(r => {
      if (seen.has(r.url!)) return false
      seen.add(r.url!)
      return true
    })
  } catch (error) {
    console.error('Failed to fetch Bluesky:', error)
    return []
  }
}

// Fetch from X/Twitter using web search simulation
// Since we don't have Twitter API access, we'll construct search-friendly data
async function fetchTwitter(): Promise<RawTrendData[]> {
  try {
    // Get trusted AI authors from our config
    const trustedHandles = Object.keys(TRUSTED_AUTHORS).slice(0, 10)

    // We'll create placeholder entries that Claude's web search can verify
    // These are known active AI commentators whose recent posts are likely relevant
    const twitterSources: RawTrendData[] = [
      {
        title: '[X/Twitter] Recent AI discussions from @karpathy, @ylecun, @sama and other AI leaders',
        source: 'Twitter/X',
        author: 'multiple',
        engagement: 500,
        url: 'https://x.com/search?q=AI%20OR%20LLM%20OR%20GPT&f=live',
        timestamp: new Date(),
      },
      {
        title: '[X/Twitter] Trending: AI announcements and releases',
        source: 'Twitter/X',
        author: 'trending',
        engagement: 400,
        url: 'https://x.com/search?q=AI%20announcement%20OR%20AI%20release&f=live',
        timestamp: new Date(),
      },
    ]

    // Add individual trusted author entries for Claude to search
    for (const handle of trustedHandles.slice(0, 5)) {
      twitterSources.push({
        title: `[X/Twitter] Recent posts from @${handle} about AI`,
        source: 'Twitter/X',
        author: handle,
        engagement: 300,
        url: `https://x.com/${handle}`,
        timestamp: new Date(),
      })
    }

    return twitterSources
  } catch (error) {
    console.error('Failed to prepare Twitter sources:', error)
    return []
  }
}

// Expanded RSS feeds
async function fetchRSSFeeds(): Promise<RawTrendData[]> {
  const feeds = [
    // Official AI company blogs (Tier 1)
    { name: 'Anthropic Blog', url: 'https://www.anthropic.com/rss.xml', tier: 1 },
    { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml', tier: 1 },
    { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', tier: 1 },
    { name: 'DeepMind Blog', url: 'https://deepmind.google/blog/rss.xml', tier: 1 },

    // Tech news (Tier 2)
    { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', tier: 2 },
    { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', tier: 2 },
    { name: 'Ars Technica AI', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', tier: 2 },
    { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', tier: 2 },

    // AI-focused publications (Tier 2)
    { name: 'The Decoder', url: 'https://the-decoder.com/feed/', tier: 2 },
    { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', tier: 2 },
  ]

  const results: RawTrendData[] = []

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.url, {
        headers: {
          'User-Agent': 'AI-Trend-Digest/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
      })

      if (!res.ok) {
        console.log(`RSS feed ${feed.name} returned ${res.status}`)
        continue
      }

      const text = await res.text()

      // Handle both RSS and Atom formats
      const items = text.match(/<item>[\s\S]*?<\/item>/g) ||
                   text.match(/<entry>[\s\S]*?<\/entry>/g) || []

      for (const item of items.slice(0, 5)) {
        // RSS format
        let titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)
        let linkMatch = item.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)
        let dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/)

        // Atom format fallback
        if (!titleMatch) {
          titleMatch = item.match(/<title[^>]*>(.*?)<\/title>/)
        }
        if (!linkMatch) {
          const hrefMatch = item.match(/<link[^>]*href=["']([^"']+)["']/)
          if (hrefMatch) {
            linkMatch = [null, hrefMatch[1]] as unknown as RegExpMatchArray
          }
        }
        if (!dateMatch) {
          dateMatch = item.match(/<updated>(.*?)<\/updated>/) ||
                     item.match(/<published>(.*?)<\/published>/)
        }

        if (titleMatch && titleMatch[1]) {
          // Filter for AI-related content in non-AI-specific feeds
          const title = titleMatch[1].replace(/<[^>]+>/g, '').trim()
          const isAIRelated = feed.tier === 1 ||
            /\b(ai|artificial intelligence|gpt|llm|claude|machine learning|neural|chatbot|openai|anthropic|gemini)\b/i.test(title)

          if (isAIRelated) {
            results.push({
              title: title,
              source: feed.name,
              engagement: feed.tier === 1 ? 1000 : 500, // Higher score for official blogs
              url: linkMatch ? linkMatch[1] : undefined,
              timestamp: dateMatch ? new Date(dateMatch[1]) : new Date(),
            })
          }
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${feed.name} RSS:`, error)
    }
  }

  return results
}

// Format scored trends for Claude with ranking info
function formatTrendsForClaude(scoredTrends: ScoredTrend[]): string {
  const sections: string[] = []

  // Group by source for readability
  const bySource = new Map<string, ScoredTrend[]>()
  for (const trend of scoredTrends) {
    const sourceGroup = trend.source.includes('r/') ? 'Reddit' :
      trend.source.includes('Blog') || trend.source.includes('TechCrunch') ||
      trend.source.includes('Verge') || trend.source.includes('Decoder') ? 'News & Blogs' :
      trend.source
    if (!bySource.has(sourceGroup)) {
      bySource.set(sourceGroup, [])
    }
    bySource.get(sourceGroup)!.push(trend)
  }

  // Format each section
  Array.from(bySource.entries()).forEach(([source, trends]) => {
    sections.push(`=== ${source.toUpperCase()} ===`)
    for (const t of trends) {
      const breakdown = t.scoreBreakdown
      sections.push(
        `[${t.source}] ${t.title}\n` +
        `  Score: ${t.finalScore} (base: ${breakdown.baseEngagement.toFixed(0)}, ` +
        `tier: ${breakdown.sourceTierMultiplier}x, ` +
        `author: ${breakdown.authorBoost}x, ` +
        `velocity: ${breakdown.velocityMultiplier}x, ` +
        `keywords: ${breakdown.keywordBoost}x)` +
        (t.author ? `\n  Author: @${t.author}` : '') +
        (t.url ? `\n  URL: ${t.url}` : '')
      )
    }
    sections.push('')
  })

  // Add ranking summary at the top
  const topTrends = scoredTrends.slice(0, 10)
  const summary = [
    '=== TOP RANKED TRENDS (weighted scores) ===',
    ...topTrends.map((t, i) =>
      `${i + 1}. [Score: ${t.finalScore}] ${t.title.slice(0, 80)}${t.title.length > 80 ? '...' : ''}`
    ),
    '',
    'Full data by source:',
    '',
  ]

  return [...summary, ...sections].join('\n')
}

// Find cross-platform mentions
function findCrossPlatformMentions(trends: RawTrendData[]): Map<string, string[]> {
  const mentions = new Map<string, string[]>()

  // Extract key terms from each title
  const keyTerms = [
    'gpt-5', 'gpt-4', 'gpt-4o', 'claude', 'gemini', 'llama', 'mistral',
    'openai', 'anthropic', 'google', 'meta', 'cursor', 'copilot', 'chatgpt',
    'deepmind', 'hugging face', 'stability ai', 'midjourney'
  ]

  for (const trend of trends) {
    const titleLower = trend.title.toLowerCase()
    for (const term of keyTerms) {
      if (titleLower.includes(term)) {
        const key = term
        if (!mentions.has(key)) {
          mentions.set(key, [])
        }
        if (!mentions.get(key)!.includes(trend.source)) {
          mentions.get(key)!.push(trend.source)
        }
      }
    }
  }

  return mentions
}

// Main scanner function
export async function scanTrends(options?: ScanOptions): Promise<TrendAnalysis[]> {
  const results = await scanTrendsWithBreakdown(options)
  return results.trends
}

// Scanner with detailed breakdown
export async function scanTrendsWithBreakdown(options?: ScanOptions): Promise<ScanResults> {
  console.log('Starting trend scan with weighted ranking...')
  console.log('Scanning sources: HackerNews, Reddit, Bluesky, Twitter/X, RSS feeds')

  if (options?.subreddits) {
    console.log('Custom subreddits:', options.subreddits.join(', '))
  }
  if (options?.topics) {
    console.log('Focus topics:', options.topics.join(', '))
  }

  // Fetch from all sources in parallel
  const [hackerNews, reddit, bluesky, twitter, rss] = await Promise.all([
    fetchHackerNews(),
    fetchReddit(options?.subreddits),
    fetchBluesky(),
    fetchTwitter(),
    fetchRSSFeeds(),
  ])

  const sourceBreakdown = {
    hackerNews: hackerNews.length,
    reddit: reddit.length,
    bluesky: bluesky.length,
    twitter: twitter.length,
    rss: rss.length,
    total: 0,
  }

  // Combine all raw data
  const allTrends = [...hackerNews, ...reddit, ...bluesky, ...twitter, ...rss]
  sourceBreakdown.total = allTrends.length

  console.log('\n=== SOURCE BREAKDOWN ===')
  console.log(`- HackerNews: ${hackerNews.length} items`)
  console.log(`- Reddit: ${reddit.length} items`)
  console.log(`- Bluesky: ${bluesky.length} items`)
  console.log(`- Twitter/X: ${twitter.length} items`)
  console.log(`- RSS Feeds: ${rss.length} items`)
  console.log(`- TOTAL: ${allTrends.length} items`)

  if (allTrends.length === 0) {
    console.log('Not enough data collected, returning empty trends')
    return { trends: [], sourceBreakdown }
  }

  // Find cross-platform mentions and add to trends
  const crossPlatform = findCrossPlatformMentions(allTrends)
  const crossPlatformEntries = Array.from(crossPlatform.entries())
  for (const trend of allTrends) {
    const titleLower = trend.title.toLowerCase()
    for (const [term, platforms] of crossPlatformEntries) {
      if (titleLower.includes(term) && platforms.length > 1) {
        trend.platforms = platforms
      }
    }
  }

  // Apply ranking algorithm with user options
  const rankingOptions: RankingOptions = {
    userTrustedAuthors: options?.trustedAuthors,
    userTopics: options?.topics,
  }
  let scoredTrends = rankTrends(allTrends, rankingOptions)

  // Cap to top 30 items to reduce Claude API costs
  scoredTrends = scoredTrends.slice(0, 30)

  console.log('\nTop 5 ranked trends:')
  for (const t of scoredTrends.slice(0, 5)) {
    console.log(`  [${t.finalScore}] ${t.title.slice(0, 60)}...`)
    console.log(`    Source: ${t.source}, Author: ${t.author || 'unknown'}`)
  }

  // Format for Claude with ranking info
  const formattedData = formatTrendsForClaude(scoredTrends)

  // Send to Claude for analysis with content style
  console.log('\nSending ranked data to Claude for analysis...')
  const analyzeOptions: AnalyzeOptions = {
    contentStyle: options?.contentStyle,
    topics: options?.topics,
  }
  const trends = await analyzeTrends(formattedData, analyzeOptions)

  console.log(`Claude identified ${trends.length} trends`)
  return { trends, sourceBreakdown }
}
