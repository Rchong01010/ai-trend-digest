import Anthropic from '@anthropic-ai/sdk'
import { ContentStyle } from './supabase'
import { sendErrorAlert } from './resend'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  preRequestDelayMs: 500, // Delay before each API call
}

// Helper to sleep for a given duration
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Retry wrapper with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      // Add pre-request delay to avoid rate limits
      if (attempt > 0 || RETRY_CONFIG.preRequestDelayMs > 0) {
        const delay = attempt === 0
          ? RETRY_CONFIG.preRequestDelayMs
          : Math.min(
              RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1),
              RETRY_CONFIG.maxDelayMs
            )
        console.log(`[${operationName}] ${attempt === 0 ? 'Pre-request delay' : `Retry ${attempt}/${RETRY_CONFIG.maxRetries}, waiting`}: ${delay}ms`)
        await sleep(delay)
      }

      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if it's a rate limit error (429)
      const isRateLimit =
        lastError.message.includes('429') ||
        lastError.message.includes('rate limit') ||
        lastError.message.includes('Rate limit') ||
        (error as { status?: number })?.status === 429

      // Check if it's an overloaded error (529)
      const isOverloaded =
        lastError.message.includes('529') ||
        lastError.message.includes('overloaded') ||
        (error as { status?: number })?.status === 529

      if ((isRateLimit || isOverloaded) && attempt < RETRY_CONFIG.maxRetries) {
        console.warn(`[${operationName}] ${isRateLimit ? 'Rate limited' : 'API overloaded'} (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}). Will retry...`)
        continue
      }

      // For non-retryable errors or if we've exhausted retries, send alert and throw
      console.error(`[${operationName}] Failed after ${attempt + 1} attempts:`, lastError.message)

      // Send error alert after exhausting retries
      if (attempt >= RETRY_CONFIG.maxRetries) {
        sendErrorAlert(
          `${operationName} Failed`,
          `The ${operationName} operation failed after ${RETRY_CONFIG.maxRetries + 1} attempts.`,
          lastError.message
        ).catch(err => console.error('Failed to send error alert:', err))
      }

      throw lastError
    }
  }

  throw lastError || new Error(`${operationName} failed after ${RETRY_CONFIG.maxRetries + 1} attempts`)
}

export interface TrendAnalysis {
  title: string
  category: 'models' | 'tools' | 'research' | 'drama' | 'tutorials'
  summary: string
  why_it_matters: string
  tiktok_angle: string
  script: string
  sources: Array<{ url: string; platform: string; title: string }>
  engagement_score: number
}

export interface AnalyzeOptions {
  contentStyle?: ContentStyle
  topics?: string[]
}

const STYLE_PROMPTS: Record<ContentStyle, string> = {
  tiktok: `SCRIPT FORMAT (30-45 seconds when read aloud):
- Open with a hook (pattern interrupt, something surprising)
- Explain the story in plain English (no jargon), 2-3 sentences
- Tell them why they should care (make it personal/relatable)
- End with a hot take or question to drive comments

Tone: Casual, like explaining to a friend who's smart but not technical. Slightly irreverent, not corporate.

Example script:
"Ok so Google's AI is now citing TikTok wellness influencers over the CDC for health advice. Let me explain why that's insane...

Basically, Google's AI summaries are pulling from whatever ranks highest, and turns out wellness TikTokers have great SEO. So now when you search 'is ibuprofen safe', you might get advice from someone who thinks crystals cure headaches.

Why should you care? Because next time you Google your symptoms, you might get medical advice from someone whose main qualification is a ring light.

Honestly though, is this Google's fault or ours for making wellness content so viral?"`,

  youtube: `SCRIPT FORMAT (60-90 seconds when read aloud):
- Open with a compelling hook that sets up the story
- Provide context and background (who, what, when)
- Explain the key details with examples
- Discuss implications and why viewers should care
- End with your take and a call to engage (comment, subscribe)

Tone: Informative but conversational. Like a knowledgeable friend breaking down the news.

Example script:
"So something really interesting just happened in the AI world that I think we need to talk about.

Google's AI search summaries are now pulling health information from TikTok wellness creators instead of, you know, actual medical sources like the CDC. And this is a bigger deal than it sounds.

Here's what's happening: Google's AI prioritizes content that ranks well in search. Turns out, wellness influencers are really good at SEO. So when someone searches for 'is ibuprofen safe', the AI might summarize advice from someone whose medical credentials consist of a ring light and good lighting.

Why does this matter to you? We're entering an era where AI is mediating more of our information. If the AI is trained to prioritize engagement over accuracy, that's a problem we all need to be aware of.

Drop your thoughts in the comments - do you think Google needs to fix this, or is this just the internet being the internet?"`,

  linkedin: `SCRIPT FORMAT (LinkedIn post, 150-200 words):
- Open with a thought-provoking observation or statistic
- Explain the business/professional implications
- Provide a balanced analysis with insights
- End with a professional takeaway or question for discussion

Tone: Professional but accessible. Insightful, not sensational. Focus on business impact.

Example:
"Google's AI search is now citing wellness influencers over medical institutions for health queries.

This isn't just a consumer issue—it's a signal about where AI-mediated information is heading.

The technical reality: AI summaries prioritize content that ranks well. Wellness creators have mastered SEO. Medical institutions haven't. The result? Potentially dangerous information getting amplified.

For business leaders, this raises critical questions:
- How do we ensure AI systems in our organizations prioritize accuracy over engagement?
- What's our responsibility when AI mediates customer-facing information?
- How do we build trust when users can't distinguish AI-curated content from verified sources?

The companies that solve this trust problem will have a significant competitive advantage.

What's your organization doing to ensure AI reliability?"`,

  twitter: `SCRIPT FORMAT (Twitter/X thread, 4-6 tweets):
- Tweet 1: Hook that makes people stop scrolling
- Tweets 2-4: Key points, one per tweet, punchy and quotable
- Final tweet: Hot take or question to drive engagement

Tone: Sharp, witty, slightly provocative. Every tweet should stand alone but build a narrative.

Example thread:
"Google's AI is now getting health advice from TikTok wellness influencers instead of the CDC.

Let that sink in. 🧵

1/ When you Google 'is ibuprofen safe', the AI might summarize advice from someone whose medical qualification is a ring light.

Why? Because wellness TikTokers have better SEO than medical institutions.

2/ This is the AI information problem in a nutshell:

AI optimizes for what ranks well.
What ranks well isn't always what's accurate.
What's accurate doesn't always have good SEO.

3/ The scary part? This is just health info.

Imagine this same dynamic playing out for:
- Financial advice
- Legal information
- News and current events

4/ Hot take: This isn't a Google problem. It's an internet problem.

We built systems that reward engagement over accuracy, and now AI is learning from those systems.

The question is: can we fix it before it's too late?"`,

  newsletter: `SCRIPT FORMAT (Newsletter paragraph, 150-200 words):
- Open with the key news or development
- Explain what happened and why it's significant
- Provide context that helps readers understand the implications
- End with a forward-looking statement or takeaway

Tone: Conversational but informative, like a smart friend catching you up over coffee. Suitable for Substack/Beehiiv style newsletters.

Example:
"Google's AI search feature hit a new low this week when it started citing TikTok wellness influencers over the CDC for health queries. Yes, really.

Here's what happened: Google's AI summaries pull from whatever content ranks highest in search results. Turns out, wellness creators have mastered SEO while medical institutions... haven't. The result? When you search 'is ibuprofen safe,' you might get advice from someone whose main qualification is a ring light and good camera angles.

This matters because we're watching AI become the primary filter for how millions of people access information. If the underlying ranking systems prioritize engagement over accuracy, AI will inherit those same biases at scale.

The silver lining? This is fixable. But it requires acknowledging that search ranking and factual accuracy are two very different things. Until then, maybe double-check that health advice with an actual doctor."`,
}

function extractJSON(text: string): { trends: TrendAnalysis[] } | null {
  // Try direct parse first
  try {
    return JSON.parse(text)
  } catch {
    // Try to find JSON object in the text
    const jsonMatch = text.match(/\{[\s\S]*"trends"[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {
        // Continue to next attempt
      }
    }

    // Try to find JSON between code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1])
      } catch {
        // Continue
      }
    }

    return null
  }
}

export async function analyzeTrends(rawData: string, options?: AnalyzeOptions): Promise<TrendAnalysis[]> {
  const contentStyle = options?.contentStyle || 'tiktok'
  const stylePrompt = STYLE_PROMPTS[contentStyle]
  const platformName = contentStyle === 'tiktok' ? 'TikTok' :
    contentStyle === 'youtube' ? 'YouTube' :
    contentStyle === 'linkedin' ? 'LinkedIn' :
    contentStyle === 'newsletter' ? 'Newsletter' : 'Twitter/X'

  const topicsFilter = options?.topics?.length
    ? `\n\nFOCUS AREAS: Prioritize trends related to these topics: ${options.topics.join(', ')}`
    : ''

  const response = await withRetry(
    () => anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `You are an AI trend researcher for ${platformName} creators. I have raw data from multiple sources about what's trending in AI.

Your job:
1. Identify the 5 most important/interesting AI trends from this data
2. For each, write a short summary a non-technical person can understand
3. Suggest a ${platformName} content angle (hook/take)
4. Write a script optimized for ${platformName}. Keep scripts under 100 words.
${topicsFilter}

${stylePrompt}

Raw data:
${rawData}

IMPORTANT: Your final response must be ONLY valid JSON with this exact structure (no markdown code blocks, no explanation before or after):
{
  "trends": [
    {
      "title": "Catchy title here",
      "category": "models|tools|research|drama|tutorials",
      "summary": "2-3 sentences explaining what happened",
      "why_it_matters": "1 sentence for normal people",
      "tiktok_angle": "Short hook idea for ${platformName}",
      "script": "Full script optimized for ${platformName} (under 100 words)",
      "sources": [{"url": "", "platform": "", "title": ""}],
      "engagement_score": 0-100
    }
  ]
}`,
        },
      ],
    }),
    'analyzeTrends'
  )

  // Find all text blocks and try to extract JSON from them
  const textBlocks = response.content.filter(block => block.type === 'text')

  if (textBlocks.length === 0) {
    console.error('No text blocks in response:', JSON.stringify(response.content, null, 2))
    throw new Error('No text response from Claude')
  }

  // Try each text block to find valid JSON
  for (const block of textBlocks) {
    if (block.type === 'text') {
      const result = extractJSON(block.text)
      if (result?.trends && Array.isArray(result.trends)) {
        return result.trends
      }
    }
  }

  // If we still can't find JSON, log what we got
  console.error('Could not parse JSON from response. Text blocks:',
    textBlocks.map(b => b.type === 'text' ? b.text.substring(0, 500) : '').join('\n---\n')
  )

  throw new Error('Failed to parse Claude response as JSON')
}
