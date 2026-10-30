import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer 
      role="contentinfo" 
      className="border-t border-white/10 bg-slate-950 py-12 px-4 sm:px-6 w-full text-slate-400"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 text-cyan-300">
            <svg
              className="w-5 h-5 text-cyan-300"
              viewBox="0 0 64 64"
              fill="none"
              role="img"
              aria-label="Anyref logo"
            >
              <rect x="6" y="6" width="52" height="52" rx="12" stroke="currentColor" strokeWidth="4" />
              <path
                d="M24 20h-6v24h6M40 20h6v24h-6"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="32" cy="32" r="4" fill="#FF8A3D" />
            </svg>
          </div>
          <span className="font-tight font-bold text-lg text-white">anyref</span>
          <span className="text-xs text-slate-500 font-mono">
            — Any reference. Your brand. Ready to prompt.
          </span>
        </div>

        <nav aria-label="Footer Navigation" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-slate-400">
          <Link href="/workspace/generate" className="hover:text-white transition-colors">
            STUDIO
          </Link>
          <Link href="/library" className="hover:text-white transition-colors">
            WINNER VAULT
          </Link>
          <Link href="/guides" className="hover:text-white transition-colors text-cyan-300 font-semibold">
            DOCS &amp; GUIDES
          </Link>
          <Link href="/guides/poster-prompts" className="hover:text-white transition-colors">
            POSTER PROMPTS
          </Link>
          <Link href="/guides/midjourney-flux-integration" className="hover:text-white transition-colors">
            MIDJOURNEY &amp; FLUX
          </Link>
          <Link href="/guides/brand-dna-guardrails" className="hover:text-white transition-colors">
            GUARDRAILS
          </Link>
          <Link href="/guides/zero-cost-winner-vault" className="hover:text-white transition-colors">
            VAULT SCALING
          </Link>
          <Link href="/llms.txt" className="hover:text-white transition-colors text-slate-500">
            LLMS.TXT
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            PRIVACY
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            TERMS
          </Link>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-3">
        <p>© {new Date().getFullYear()} Anyref Studio. All rights reserved.</p>
        <p className="text-[11px]">
          No AI training on unreleased client assets • Ephemeral in-memory processing
        </p>
      </div>
    </footer>
  );
}
