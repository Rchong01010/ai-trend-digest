/**
 * AI Trend Digest - Ranking & Weighting Configuration
 *
 * Edit this file to customize how trends are scored and prioritized.
 * All multipliers stack multiplicatively for the final score.
 */

// =============================================================================
// SOURCE TIERS
// =============================================================================
// Multiply base engagement score based on source credibility
// Higher tier = more weight in final ranking

export const SOURCE_TIERS = {
  // Tier 1 (3x) - Official sources, highest credibility
  tier1: {
    multiplier: 3.0,
    sources: [
      'Anthropic Blog',
      'OpenAI Blog',
      'Google AI Blog',
      'DeepMind Blog',
      'Meta AI Blog',
    ],
  },

  // Tier 2 (2x) - Curated tech communities
  tier2: {
    multiplier: 2.0,
    sources: [
      'HackerNews',
      'r/MachineLearning',
      'r/LocalLLaMA',
      'arXiv',
    ],
  },

  // Tier 3 (1.5x) - General tech communities
  tier3: {
    multiplier: 1.5,
    sources: [
      'r/artificial',
      'r/ClaudeAI',
      'r/ChatGPT',
      'r/OpenAI',
      'TechCrunch',
      'The Verge',
    ],
  },

  // Tier 4 (1x) - Social media, baseline
  tier4: {
    multiplier: 1.0,
    sources: [
      'Bluesky',
      'Twitter/X',
      'YouTube',
      'Other',
    ],
  },
}

// =============================================================================
// TRUSTED AUTHORS
// =============================================================================
// Auto-boost when these influential people post
// Format: handle/username (without @) -> boost multiplier

export const TRUSTED_AUTHORS: Record<string, number> = {
  // AI Researchers & Leaders (2x boost)
  'karpathy': 2.0,           // Andrej Karpathy
  'ylecun': 2.0,             // Yann LeCun
  'sama': 2.0,               // Sam Altman
  'gaborcselle': 2.0,        // Gabor Cselle
  'demaboris': 2.0,          // Demis Hassabis
  'ilyasut': 2.0,            // Ilya Sutskever
  'drjimfan': 2.0,           // Jim Fan
  'alexandr_wang': 2.0,      // Alex Wang (Scale AI)

  // Anthropic team
  'daboris': 2.0,            // Dario Amodei
  'aaboris': 2.0,            // Amanda Amodei
  'jaboris': 2.0,            // Jack Clark

  // Prominent AI voices (1.75x boost)
  'emollick': 1.75,          // Ethan Mollick
  'svpino': 1.75,            // Santiago Valdarrama
  'minimaxir': 1.75,         // Max Woolf
  'goodside': 1.75,          // Riley Goodside
  'simonw': 1.75,            // Simon Willison

  // AI content creators (1.5x boost)
  'theaievangelist': 1.5,
  'mattshumer_': 1.5,
  'rowancheung': 1.5,
  'ai_for_success': 1.5,
}

// =============================================================================
// ENGAGEMENT VELOCITY
// =============================================================================
// Calculate engagement rate based on time since posting
// Higher velocity = content is gaining traction fast

export const VELOCITY_CONFIG = {
  // Time windows for velocity calculation (in hours)
  windows: {
    hot: 2,      // Posted in last 2 hours
    warm: 6,     // Posted in last 6 hours
    recent: 24,  // Posted in last 24 hours
  },

  // Velocity multipliers
  multipliers: {
    hot: 2.0,    // Very recent + high engagement = 2x
    warm: 1.5,   // Recent + good engagement = 1.5x
    recent: 1.2, // Within 24h + engagement = 1.2x
    older: 1.0,  // Baseline for older content
  },

  // Minimum engagement thresholds for velocity boost
  thresholds: {
    hot: 50,     // 50+ engagements in 2 hours
    warm: 100,   // 100+ engagements in 6 hours
    recent: 200, // 200+ engagements in 24 hours
  },
}

// =============================================================================
// CROSS-PLATFORM CONFIRMATION
// =============================================================================
// Boost topics appearing on multiple platforms

export const CROSS_PLATFORM_CONFIG = {
  // Minimum platforms for boost
  twoSources: {
    count: 2,
    multiplier: 1.5,
  },

  // Strong confirmation
  threePlus: {
    count: 3,
    multiplier: 2.0,
  },
}

// =============================================================================
// KEYWORD BOOSTS
// =============================================================================
// Boost content containing high-interest keywords

export const KEYWORD_BOOSTS: Record<string, number> = {
  // Breaking news indicators
  'breaking': 1.3,
  'just announced': 1.3,
  'released': 1.2,
  'launched': 1.2,

  // Model releases
  'gpt-5': 1.5,
  'gpt-4': 1.2,
  'claude': 1.3,
  'gemini 2': 1.3,
  'llama 4': 1.3,

  // Hot topics
  'agi': 1.3,
  'open source': 1.2,
  'free': 1.1,
  'benchmark': 1.2,
  'beats': 1.2,
  'outperforms': 1.2,
}

// =============================================================================
// SCORE CALCULATION
// =============================================================================
// Final score formula:
// final_score = base_engagement * source_tier * author_boost * velocity_modifier * cross_platform_boost * keyword_boost

export interface RawTrendData {
  title: string
  source: string
  author?: string
  engagement: number  // likes, upvotes, score, etc.
  comments?: number
  url?: string
  timestamp?: Date
  platforms?: string[]  // for cross-platform tracking
}

export interface ScoredTrend extends RawTrendData {
  finalScore: number
  scoreBreakdown: {
    baseEngagement: number
    sourceTierMultiplier: number
    authorBoost: number
    velocityMultiplier: number
    crossPlatformMultiplier: number
    keywordBoost: number
  }
}

/**
 * Get the source tier multiplier for a given source
 */
export function getSourceTierMultiplier(source: string): number {
  const normalizedSource = source.toLowerCase()

  for (const tier of Object.values(SOURCE_TIERS)) {
    if (tier.sources.some(s => normalizedSource.includes(s.toLowerCase()))) {
      return tier.multiplier
    }
  }

  return SOURCE_TIERS.tier4.multiplier // Default to tier 4
}

/**
 * Get author boost multiplier
 * Supports both global trusted authors and user-specific trusted authors
 */
export function getAuthorBoost(author?: string, userTrustedAuthors?: string[]): number {
  if (!author) return 1.0

  const normalizedAuthor = author.toLowerCase().replace('@', '')

  // Check user's personal trusted authors first (2x boost)
  if (userTrustedAuthors?.some(a => a.toLowerCase() === normalizedAuthor)) {
    return 2.0
  }

  // Fall back to global trusted authors
  return TRUSTED_AUTHORS[normalizedAuthor] || 1.0
}

/**
 * Calculate velocity multiplier based on engagement and time
 */
export function getVelocityMultiplier(engagement: number, timestamp?: Date): number {
  if (!timestamp) return 1.0

  const hoursAgo = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60)

  if (hoursAgo <= VELOCITY_CONFIG.windows.hot && engagement >= VELOCITY_CONFIG.thresholds.hot) {
    return VELOCITY_CONFIG.multipliers.hot
  }
  if (hoursAgo <= VELOCITY_CONFIG.windows.warm && engagement >= VELOCITY_CONFIG.thresholds.warm) {
    return VELOCITY_CONFIG.multipliers.warm
  }
  if (hoursAgo <= VELOCITY_CONFIG.windows.recent && engagement >= VELOCITY_CONFIG.thresholds.recent) {
    return VELOCITY_CONFIG.multipliers.recent
  }

  return VELOCITY_CONFIG.multipliers.older
}

/**
 * Get cross-platform confirmation multiplier
 */
export function getCrossPlatformMultiplier(platformCount: number): number {
  if (platformCount >= CROSS_PLATFORM_CONFIG.threePlus.count) {
    return CROSS_PLATFORM_CONFIG.threePlus.multiplier
  }
  if (platformCount >= CROSS_PLATFORM_CONFIG.twoSources.count) {
    return CROSS_PLATFORM_CONFIG.twoSources.multiplier
  }
  return 1.0
}

/**
 * Get keyword boost for title/content
 */
export function getKeywordBoost(text: string): number {
  const normalizedText = text.toLowerCase()
  let boost = 1.0

  for (const [keyword, multiplier] of Object.entries(KEYWORD_BOOSTS)) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      boost = Math.max(boost, multiplier) // Use highest matching keyword boost
    }
  }

  return boost
}

export interface RankingOptions {
  userTrustedAuthors?: string[]
  userTopics?: string[]
}

/**
 * Calculate final weighted score for a trend
 */
export function calculateFinalScore(trend: RawTrendData, options?: RankingOptions): ScoredTrend {
  const baseEngagement = trend.engagement + (trend.comments || 0) * 0.5
  const sourceTierMultiplier = getSourceTierMultiplier(trend.source)
  const authorBoost = getAuthorBoost(trend.author, options?.userTrustedAuthors)
  const velocityMultiplier = getVelocityMultiplier(trend.engagement, trend.timestamp)
  const crossPlatformMultiplier = getCrossPlatformMultiplier(trend.platforms?.length || 1)
  const keywordBoost = getKeywordBoost(trend.title)

  // Boost if title matches user's topics
  let topicBoost = 1.0
  if (options?.userTopics?.length) {
    const titleLower = trend.title.toLowerCase()
    if (options.userTopics.some(topic => titleLower.includes(topic.toLowerCase()))) {
      topicBoost = 1.5
    }
  }

  const finalScore = Math.round(
    baseEngagement *
    sourceTierMultiplier *
    authorBoost *
    velocityMultiplier *
    crossPlatformMultiplier *
    keywordBoost *
    topicBoost
  )

  return {
    ...trend,
    finalScore,
    scoreBreakdown: {
      baseEngagement,
      sourceTierMultiplier,
      authorBoost,
      velocityMultiplier,
      crossPlatformMultiplier,
      keywordBoost,
    },
  }
}

/**
 * Score and sort an array of trends
 */
export function rankTrends(trends: RawTrendData[], options?: RankingOptions): ScoredTrend[] {
  return trends
    .map(trend => calculateFinalScore(trend, options))
    .sort((a, b) => b.finalScore - a.finalScore)
}
