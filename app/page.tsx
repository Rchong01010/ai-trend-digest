import { Zap, Clock, Sparkles, Users, Check, ChevronDown, Mail, Settings, Inbox } from 'lucide-react'
import { EmailSignup } from '@/components/landing/EmailSignup'
import { TrendPreview } from '@/components/landing/TrendPreview'

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-electric/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-electric/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric/10 border border-electric/20 text-electric text-sm">
              <Sparkles className="w-4 h-4" />
              For content creators
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              AI moves fast.
              <br />
              <span className="gradient-text">We catch you up.</span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-xl mx-auto text-lg md:text-xl text-text-secondary">
              A 2-minute daily digest of AI news, written for creators not engineers.
              Know what's trending before you make your next video.
            </p>

            {/* Email signup */}
            <div className="flex justify-center pt-4">
              <EmailSignup />
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-electric/10">
                <Clock className="w-6 h-6 text-electric" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">2 minutes, every morning</h3>
              <p className="text-text-secondary text-sm">
                Delivered at 7am PT. Just enough to stay informed without the doomscroll.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Content angles included</h3>
              <p className="text-text-secondary text-sm">
                Every trend comes with a TikTok/YouTube hook idea. Skip the research, start recording.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Written for normal people</h3>
              <p className="text-text-secondary text-sm">
                No jargon, no PhD required. If your audience isn't ML researchers, neither is ours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              Here's what you'll get
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto">
              A curated feed of what actually matters, with content ideas built in.
            </p>
          </div>
          <TrendPreview />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 border-t border-border">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              How it works
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto">
              Get started in under a minute. No credit card required.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-electric/10 border border-electric/20">
                <Mail className="w-8 h-8 text-electric" />
              </div>
              <div className="text-4xl font-bold text-text-muted">1</div>
              <h3 className="text-lg font-semibold text-text-primary">Sign up with email</h3>
              <p className="text-text-secondary text-sm">
                Enter your email and verify. That's it - no password needed.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20">
                <Settings className="w-8 h-8 text-accent" />
              </div>
              <div className="text-4xl font-bold text-text-muted">2</div>
              <h3 className="text-lg font-semibold text-text-primary">Pick your topics</h3>
              <p className="text-text-secondary text-sm">
                Choose what AI topics you want to track. We'll personalize your digest.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <Inbox className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-4xl font-bold text-text-muted">3</div>
              <h3 className="text-lg font-semibold text-text-primary">Get daily digest</h3>
              <p className="text-text-secondary text-sm">
                Wake up to curated AI trends with content angles ready to use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              Simple pricing
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto">
              Start free, upgrade when you need more.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="bg-surface-elevated border border-border rounded-2xl p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-text-primary">$0</span>
                  <span className="text-text-muted">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>3 topics to track</span>
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Daily email digest</span>
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>TikTok content style</span>
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>5 daily trends</span>
                </li>
              </ul>
              <div className="flex justify-center">
                <EmailSignup buttonText="Get Started Free" />
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-b from-electric/5 to-transparent border-2 border-electric/30 rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-electric text-white text-xs font-semibold rounded-full">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-text-primary">$12</span>
                  <span className="text-text-muted">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-electric flex-shrink-0" />
                  <span>Unlimited topics</span>
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-electric flex-shrink-0" />
                  <span>All content styles (YouTube, LinkedIn, Twitter, Newsletter)</span>
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-electric flex-shrink-0" />
                  <span>Custom delivery time</span>
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-electric flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              <div className="flex justify-center">
                <EmailSignup buttonText="Start Pro Trial" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 border-t border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              Loved by creators
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-surface-elevated border border-border rounded-xl p-6">
              <p className="text-text-secondary mb-4">
                "Finally, I don't have to spend hours scrolling Twitter to find AI news. The content angles are gold."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-electric/20 flex items-center justify-center">
                  <span className="text-electric font-semibold">JD</span>
                </div>
                <div>
                  <div className="font-medium text-text-primary">Jamie D.</div>
                  <div className="text-sm text-text-muted">Tech YouTuber, 120K subs</div>
                </div>
              </div>
            </div>
            <div className="bg-surface-elevated border border-border rounded-xl p-6">
              <p className="text-text-secondary mb-4">
                "Went from posting 2x/week to daily because I always have ideas now. Game changer for engagement."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-accent font-semibold">MK</span>
                </div>
                <div>
                  <div className="font-medium text-text-primary">Marcus K.</div>
                  <div className="text-sm text-text-muted">TikTok Creator, 85K followers</div>
                </div>
              </div>
            </div>
            <div className="bg-surface-elevated border border-border rounded-xl p-6">
              <p className="text-text-secondary mb-4">
                "The LinkedIn format is perfect. My posts get 3x more engagement since switching to AI Trend Digest."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400 font-semibold">SR</span>
                </div>
                <div>
                  <div className="font-medium text-text-primary">Sarah R.</div>
                  <div className="text-sm text-text-muted">AI Consultant, LinkedIn Top Voice</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-4">
            <details className="group bg-surface-elevated border border-border rounded-xl">
              <summary className="flex items-center justify-between p-5 cursor-pointer">
                <span className="font-medium text-text-primary">What sources do you scan?</span>
                <ChevronDown className="w-5 h-5 text-text-muted group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-5 pb-5 text-text-secondary">
                We scan Hacker News, Reddit (multiple AI subreddits), Bluesky, X/Twitter, and RSS feeds from major AI company blogs and tech news sites. Our ranking algorithm prioritizes content from trusted sources and accounts.
              </div>
            </details>
            <details className="group bg-surface-elevated border border-border rounded-xl">
              <summary className="flex items-center justify-between p-5 cursor-pointer">
                <span className="font-medium text-text-primary">When do I get my digest?</span>
                <ChevronDown className="w-5 h-5 text-text-muted group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-5 pb-5 text-text-secondary">
                Free users receive their digest at 7am PT daily. Pro users can customize their delivery time to any hour that works for their schedule.
              </div>
            </details>
            <details className="group bg-surface-elevated border border-border rounded-xl">
              <summary className="flex items-center justify-between p-5 cursor-pointer">
                <span className="font-medium text-text-primary">Can I change my topics?</span>
                <ChevronDown className="w-5 h-5 text-text-muted group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-5 pb-5 text-text-secondary">
                Yes! You can update your topics, preferred subreddits, and trusted authors anytime from your settings dashboard. Changes take effect on your next digest.
              </div>
            </details>
            <details className="group bg-surface-elevated border border-border rounded-xl">
              <summary className="flex items-center justify-between p-5 cursor-pointer">
                <span className="font-medium text-text-primary">How do I cancel?</span>
                <ChevronDown className="w-5 h-5 text-text-muted group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-5 pb-5 text-text-secondary">
                You can cancel your Pro subscription anytime from your settings. You'll continue to have Pro access until the end of your billing period, then automatically switch to the free plan.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Social Proof (Placeholder) */}
      <section className="py-16 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-text-muted text-sm uppercase tracking-wide mb-8">
            Trusted by creators making AI content
          </p>
          <div className="flex flex-wrap justify-center gap-8 opacity-40">
            {/* Placeholder logos - replace with real ones later */}
            {['@techcreator', '@aiexplained', '@futureproof', '@bytesized'].map((handle) => (
              <div key={handle} className="text-text-secondary font-mono">
                {handle}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-surface to-surface-elevated">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
            Stop missing the story
          </h2>
          <p className="text-text-secondary text-lg">
            Join thousands of creators who start their day knowing what's trending in AI.
          </p>
          <div className="flex justify-center">
            <EmailSignup />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <Sparkles className="w-5 h-5 text-electric" />
              <span className="font-semibold">AI Trend Digest</span>
            </div>
            <div className="flex gap-6 text-sm text-text-muted">
              <a href="#" className="hover:text-text-secondary transition-colors">Privacy</a>
              <a href="#" className="hover:text-text-secondary transition-colors">Terms</a>
              <a href="mailto:hello@aitrenddigest.com" className="hover:text-text-secondary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
