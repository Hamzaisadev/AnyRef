import Link from 'next/link';
import { Cpu, ShieldCheck, Sparkles, Terminal, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function DefinitionSection() {
  return (
    <section
      id="definition"
      aria-labelledby="definition-heading"
      className="relative z-20 py-12 sm:py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full border-b border-border-subtle"
    >
      {/* Extractable Answer Block — Optimized for Google AI Overviews and Perplexity Citations */}
      <div className="p-8 sm:p-10 rounded-3xl bg-surface border border-border-subtle shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle/80 pb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono tracking-wider bg-primary/10 border border-primary/20 text-primary">
            <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
            <span>AI OVERVIEW &amp; KNOWLEDGE BASE SPECIFICATION</span>
          </div>
          <span className="text-xs font-mono text-layout-layer">
            Entity: <strong className="text-ink">Anyref Studio</strong> • Updated: October 2026
          </span>
        </div>

        <div className="space-y-4">
          <h2
            id="definition-heading"
            className="font-tight font-extrabold text-2xl sm:text-4xl text-ink tracking-tight leading-snug"
          >
            What is Anyref?
          </h2>

          {/* Primary Definition (1-2 sentences within first 150 words for extractability) */}
          <p className="text-base sm:text-lg text-ink font-sans leading-relaxed">
            <strong className="text-primary font-semibold">Anyref</strong> is a private visual prompt-engineering studio and prompt-library web application that turns Pinterest, Behance, and Instagram reference posters into reusable, structured image-generation prompts tailored to specific brands. It isolates camera perspective, 3-point lighting, and compositional geometry into parametric slots for Midjourney v6.1, FLUX.1, and Ideogram while enforcing zero brand drift and programmatic Never-Invent price guardrails.
          </p>

          <p className="text-sm sm:text-base text-layout-layer leading-relaxed">
            Unlike in-app image generators that markup cloud GPU credits, Anyref functions as an upstream prompt compiler and ordered asset sequencer. Marketing agencies and design studios use Anyref to deconstruct visual posters, auto-inject brand DNA (wordmarks, exact hex palettes, typography rules), and build an appreciating internal library of tested, zero-cost winner templates.
          </p>
        </div>

        {/* 3 Extractable Core Concepts for Question-Based Citations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border-subtle space-y-2">
            <div className="flex items-center space-x-2 text-primary text-xs font-mono font-bold uppercase">
              <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Parametric Slot Syntax</span>
            </div>
            <h3 className="font-tight font-bold text-sm text-ink">
              Structured Prompt Templates
            </h3>
            <p className="text-xs text-layout-layer leading-relaxed">
              Templates separate fixed Layout Text from variable Brand Slots (<code className="text-primary font-mono text-[11px]">&#123;&#123;brand_name&#125;&#125;</code>) and Campaign Slots (<code className="text-accent font-mono text-[11px]">&#123;&#123;product_shot&#125;&#125;</code>), supporting conditional blocks <code className="text-layout-layer font-mono text-[11px]">[[?key: ...]]</code>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border-subtle space-y-2">
            <div className="flex items-center space-x-2 text-danger text-xs font-mono font-bold uppercase">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Anti-Hallucination Guard</span>
            </div>
            <h3 className="font-tight font-bold text-sm text-ink">
              Never-Invent &amp; "Needs You"
            </h3>
            <p className="text-xs text-layout-layer leading-relaxed">
              AI models are strictly forbidden from inventing prices, percentage discounts, promo codes, or dates. Sensitive fields enter a mandatory "Needs You" state until verified by a human.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border-subtle space-y-2">
            <div className="flex items-center space-x-2 text-success text-xs font-mono font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Compounding ROI</span>
            </div>
            <h3 className="font-tight font-bold text-sm text-ink">
              Zero-Cost Winner Vault
            </h3>
            <p className="text-xs text-layout-layer leading-relaxed">
              High-converting prompts proven in external generators are saved as locked Winners. Teams remix them for seasonal campaigns at <strong className="text-ink">$0.00 in AI token costs</strong>.
            </p>
          </div>
        </div>

        {/* Citable Benchmark Data & Attribution */}
        <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-layout-layer font-mono gap-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
            <span>
              Attributed Benchmark (AnyRef Spikes 2026): 0% Price Hallucinations • 100% Brand Color Fidelity
            </span>
          </div>
          <Link
            href="/guides"
            className="inline-flex items-center space-x-1.5 text-primary hover:text-primary/80 font-bold transition-colors"
          >
            <span>Explore Architecture Guides</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
