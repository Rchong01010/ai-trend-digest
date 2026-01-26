import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const sampleTrends = [
  {
    title: "Claude gets computer use - can now control your desktop",
    category: "models",
    summary: "Anthropic released computer use capabilities for Claude. It can now see your screen, move the mouse, type, and interact with any application. Early testers are using it to automate complex workflows that were impossible before.",
    why_it_matters: "This is the closest we've gotten to a true AI assistant that can do anything you can do on a computer.",
    tiktok_angle: "POV: You gave an AI full control of your computer and it's now better at Excel than your entire accounting department",
    script: `Ok so Anthropic just gave their AI the ability to literally USE your computer. Like, see your screen, move your mouse, click buttons, type stuff. Let me explain why this is wild.

Basically Claude can now do anything you can do on a computer. Fill out forms, navigate websites, use apps - all of it. People are already using it to automate things that were impossible before, like complex multi-step workflows across different apps.

Why should you care? Because this is basically the first step toward having a real digital assistant. Not one that just talks to you, but one that can actually DO things for you.

The real question is: are you ready to let an AI have access to your computer? Because that future is here.`,
    sources: [{ url: "https://anthropic.com/news/computer-use", platform: "Anthropic", title: "Introducing computer use" }],
    engagement_score: 95,
  },
  {
    title: "Llama 4 benchmarks leak - beats GPT-4 on coding",
    category: "models",
    summary: "Leaked benchmarks show Meta's upcoming Llama 4 outperforming GPT-4 on HumanEval and other coding benchmarks. The model is expected to be open-weight like previous versions.",
    why_it_matters: "Free open-source models are now competitive with the best closed models. The AI moat is shrinking fast.",
    tiktok_angle: "The free AI just beat the $200/month AI at coding. OpenAI shareholders in shambles.",
    script: `So leaked benchmarks just showed that Meta's new Llama 4 is beating GPT-4 at coding. And here's the kicker - it's going to be completely free.

Meta's been releasing their AI models as open source, which means anyone can download and use them. And now their latest version is outperforming the model that costs $200 a month to use.

Why does this matter to you? Because the gap between free AI and paid AI is basically disappearing. Companies that built their whole business on having the "best" AI are watching their advantage evaporate in real time.

Hot take: OpenAI's moat isn't their tech anymore - it's just brand recognition. And that's not gonna last forever.`,
    sources: [{ url: "https://reddit.com/r/LocalLLaMA", platform: "Reddit", title: "Llama 4 benchmark discussion" }],
    engagement_score: 88,
  },
  {
    title: "Cursor hits 100k paying users",
    category: "tools",
    summary: "The AI code editor Cursor announced 100,000 paying subscribers, making it one of the fastest-growing dev tools ever. Engineers report 2-3x productivity gains.",
    why_it_matters: "AI coding tools are no longer experimental - they're becoming essential for staying competitive.",
    tiktok_angle: "This $20/month tool is why junior devs are now shipping like seniors",
    script: `There's this code editor called Cursor that just hit 100,000 paying users, and it's changing how people think about programming.

It's basically VS Code but with AI built in that actually understands your entire codebase. Developers are reporting they're 2-3x more productive. Junior devs are shipping code that looks like it came from seniors.

Why should you care even if you're not a developer? Because this is happening to every profession. AI tools that make beginners perform like experts are coming for every industry.

The question isn't whether AI will change your job - it's whether you'll be the one using the AI or competing against people who are.`,
    sources: [{ url: "https://cursor.com", platform: "Cursor", title: "Cursor announcement" }],
    engagement_score: 82,
  },
  {
    title: "OpenAI researcher quits, posts cryptic safety warning",
    category: "drama",
    summary: "Another senior OpenAI safety researcher departed this week, posting vague concerns about 'the direction things are heading' without specifics. This follows a pattern of safety team departures over the past year.",
    why_it_matters: "The people closest to frontier AI development keep leaving and expressing concerns. Pattern or paranoia?",
    tiktok_angle: "OpenAI safety researchers keep rage-quitting and I'm running out of popcorn",
    script: `Another OpenAI safety researcher just quit and posted some cryptic stuff about being "concerned about the direction things are heading." This is like the fifth one this year.

These are the people whose literal job was to make sure the AI doesn't go off the rails. And they keep leaving and posting vague warnings without actually telling us what's wrong.

Why should you care? Well, either these people know something we don't and we should be worried. Or they're being dramatic and the AI safety field has a culture problem. Either way, not great!

Honestly though - if you knew something scary about AI, would you post a cryptic tweet about it or would you actually tell people? Make it make sense.`,
    sources: [{ url: "https://x.com", platform: "X/Twitter", title: "Resignation thread" }],
    engagement_score: 76,
  },
  {
    title: "New fine-tuning technique cuts costs by 90%",
    category: "research",
    summary: "Researchers published a paper on 'Sparse Fine-Tuning' that achieves similar results to full fine-tuning while only updating 10% of model parameters. Major implications for custom AI development.",
    why_it_matters: "Custom AI models just got way more accessible for smaller companies and indie developers.",
    tiktok_angle: "Scientists just made training your own AI 10x cheaper - here's what that means for you",
    script: `Scientists just figured out how to train custom AI models for 90% less money. Here's why that actually matters.

So normally if you want to customize an AI for your specific use case, you have to retrain huge parts of the model which costs a fortune. This new technique only updates 10% of the model and gets the same results.

Why should you care? Because this means small companies and indie developers can now afford to build custom AI tools. It's not just for big tech anymore.

We're about to see an explosion of specialized AI tools for super niche use cases. Your industry probably doesn't have good AI tools yet - but it's about to.`,
    sources: [{ url: "https://arxiv.org", platform: "arXiv", title: "Sparse Fine-Tuning paper" }],
    engagement_score: 71,
  },
  {
    title: "How to build agents with Claude - full tutorial",
    category: "tutorials",
    summary: "Anthropic released comprehensive documentation on building AI agents using Claude's tool use capabilities. Includes patterns for memory, planning, and multi-step reasoning.",
    why_it_matters: "Building AI agents is becoming accessible to regular developers, not just ML researchers.",
    tiktok_angle: "I built an AI agent that books my flights and it only took 50 lines of code",
    script: `Anthropic just released a guide on building AI agents and honestly it's way easier than I expected. Let me break it down.

An AI agent is basically an AI that can use tools, remember things, and complete multi-step tasks. Think booking a flight - it needs to search, compare prices, fill out forms, all that stuff. The new guide shows you exactly how to build this.

Why should you care? Because the barrier to building useful AI tools just dropped massively. You don't need a PhD anymore. If you can write basic code, you can build an AI agent.

I'm genuinely curious - if you could have an AI agent do any task for you automatically, what would it be? Drop it in the comments.`,
    sources: [{ url: "https://docs.anthropic.com/en/docs/agents", platform: "Anthropic Docs", title: "Building agents guide" }],
    engagement_score: 68,
  },
  {
    title: "Google announces Gemini 2.0 with native image generation",
    category: "models",
    summary: "Google's latest Gemini model can now generate images natively within conversations, similar to GPT-4o. Early reviews suggest image quality rivals Midjourney for most use cases.",
    why_it_matters: "Multimodal AI is becoming the default. Text-only models are starting to feel limited.",
    tiktok_angle: "Google's new AI makes images while you chat with it - here's how it compares to Midjourney",
    script: `Google just dropped Gemini 2.0 and it can generate images while you chat with it. Like, mid-conversation. Let me show you why this changes things.

Before, you had to use separate tools - ChatGPT for text, Midjourney for images, something else for video. Now it's all in one. You can be having a conversation and just say "show me what that would look like" and boom, image.

Why should you care? Because this is what AI is becoming - not separate tools for separate things, but one AI that does everything. Text-only chatbots are gonna feel ancient real soon.

Real talk though - are you team "one AI for everything" or do you prefer specialized tools? I'm genuinely torn on this one.`,
    sources: [{ url: "https://blog.google/technology/ai/gemini-2", platform: "Google Blog", title: "Gemini 2.0 announcement" }],
    engagement_score: 85,
  },
]

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Clear existing trends for today
    await supabaseAdmin
      .from('trends')
      .delete()
      .eq('date', today)

    // Insert sample trends
    const trendsToInsert = sampleTrends.map(trend => ({
      ...trend,
      date: today,
    }))

    const { data, error } = await supabaseAdmin
      .from('trends')
      .insert(trendsToInsert)
      .select()

    if (error) {
      console.error('Seed error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Seeded trends successfully',
      count: data?.length || 0,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
