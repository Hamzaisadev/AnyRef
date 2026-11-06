# Anyref Phased Multi-Channel Launch Strategy & Execution Checklist

**Version**: 1.0.0  
**Target Release**: Anyref Public Commercial Launch  
**Frameworks**: ORB Channels (Owned, Rented, Borrowed), Phased Launch Playbook (Tier 1)

---

## 1. Executive Summary & Positioning

Anyref is a private prompt-engineering workspace and library that deconstructs visual reference posters (from Pinterest, Instagram, or ad campaigns) into reusable, structured, fill-in-the-blank image generation prompts tailored to specific brands.

### Positioning Statement
> *For marketing and creative teams who struggle to replicate visual reference posters into branded AI assets, Anyref is a prompt-engineering library that deconstructs any reference poster into structured, brand-injected prompts with zero hallucinations and reusable winners—unlike chaotic prompt trial-and-error, we guarantee brand consistency in one click.*

### Launch Tier Classification
* **Tier 1: Major Public Launch**: 4–6 weeks prep, synchronized multi-channel rollout across Product Hunt, Twitter/X, LinkedIn, Reddit, and Instagram.

---

## 2. Channel Architecture (The ORB Model)

| Channel | Category | Primary Role | Target Audience | Tone / Core Format |
| :--- | :--- | :--- | :--- | :--- |
| **Product Hunt** | **Borrowed** | Early-adopter spike, social proof, ranking badge | Tech early adopters, indie makers, AI creators | Maker-to-community, transparent story, interactive demo |
| **Twitter / X** | **Borrowed / Owned** | Viral distribution, visual hype, build-in-public | AI prompters, digital creators, Midjourney/Flux users | Punchy, video-first, 5–7 tweet narrative thread |
| **LinkedIn** | **Owned / Borrowed** | B2B pipeline, agency founders, design directors | Creative directors, agency owners, brand marketers | Professional case study, ROI/time-savings, PDF carousel |
| **Reddit** | **Borrowed** | Deep technical validation, authentic peer feedback | r/SideProject, r/SaaS, r/Midjourney, r/StableDiffusion | 100% transparent, no marketing fluff, workflow teardown |
| **Instagram** | **Owned** | Visual proof, aesthetic appeal, brand authority | Visual designers, social media managers | Split-screen Before/After reels, educational carousel |

---

## 3. Master Timeline & Milestones

```
Week -4 to -2 (Foundation & Audience Warming)
  │  ├── Finalize value prop, demo videos, and landing page
  │  ├── Warm up Maker profiles & seed build-in-public teasers on X/Reddit
  │  └── Build VIP waitlist / early access cohort
  ▼
Week -2 to -1 (Asset Lock & War Room Staging)
  │  ├── Schedule PH listing & draft Maker First Comment
  │  ├── Queue multi-platform social drafts (X, LinkedIn, Reddit, Instagram)
  │  └── Verify tracking (UTM parameters, event pipelines, error logging)
  ▼
Launch Day (T-0: 12:01 AM PT to T+24h)
  │  ├── 12:01 AM PT: Product Hunt go-live + First Maker Comment
  │  ├── 06:30 AM PT: X Launch Thread + LinkedIn announcement
  │  ├── 08:30 AM PT: Subreddit posts (r/SideProject, r/Midjourney)
  │  ├── 10:00 AM PT: Instagram Reel + Carousel live
  │  └── Continuous: Respond to every comment within 15–30 minutes
  ▼
Days 2 to 30 (Post-Launch Flywheel)
     ├── Share launch metrics & "What We Learned" teardowns
     ├── Convert PH/X buzz into case studies and directory listings
     └── Retarget non-converting launch visitors
```

---

## 4. Phase-by-Phase Checklist

### Phase 1: Pre-Launch Foundation (Weeks -4 to -2)

#### 1. Positioning & Core Assets
- [ ] **Lock One-Sentence Value Prop**: "Turn visual reference posters into brand-safe AI prompts in seconds."
- [ ] **Landing Page QA**:
  - [ ] Value prop clear above the fold within 5 seconds.
  - [ ] Sticky primary CTA (*"Start Free" / "Explore Workspace"*).
  - [ ] 30–60 second hero video / looping demo showcasing upload ➔ deconstruction ➔ brand injection.
  - [ ] Clear FAQ addressing common objections (pricing, privacy, external generator compatibility).
- [ ] **Analytics & Tracking Infrastructure**:
  - [ ] GA4 / Telemetry conversion events configured and tested.
  - [ ] Tagged UTM matrix configured for every channel:
    - `utm_source=producthunt&utm_medium=launch`
    - `utm_source=twitter&utm_medium=launch_thread`
    - `utm_source=linkedin&utm_medium=founder_post`
    - `utm_source=reddit&utm_medium=r_sideproject`
    - `utm_source=instagram&utm_medium=bio`

#### 2. Audience Warming & Seeding
- [ ] **Product Hunt Community Warming**:
  - [ ] Set up or refresh Hunter/Maker profiles with real avatars, bio, and social links.
  - [ ] Actively upvote, review, and comment on other products daily to build Maker karma.
- [ ] **Twitter / X Build-in-Public**:
  - [ ] Share 2–3 "behind-the-scenes" snippets (10s screen recordings showing reference extraction vs. raw Midjourney prompt).
  - [ ] Gather 20–50 early beta testers into a private DM group or waitlist.
- [ ] **Reddit Community Integration**:
  - [ ] Participate organically in target subreddits (`r/SideProject`, `r/SaaS`, `r/Midjourney`, `r/StableDiffusion`).
  - [ ] Do **not** post launch links yet; establish account comment karma and domain credibility.

---

### Phase 2: Final Sprint & Channel Staging (Weeks -2 to -1)

#### 1. Product Hunt Staging
- [ ] **Confirm Launch Day**: Target **Tuesday, Wednesday, or Thursday** (highest organic traffic days; avoid Friday–Sunday unless targeting low-competition weekend badge).
- [ ] **Asset Deliverables**:
  - [ ] **Product Name**: Anyref.
  - [ ] **Tagline**: Max 60 characters (e.g., *"Turn visual reference posters into branded AI prompts"*).
  - [ ] **Thumbnail**: 240x240px (clean logo or animated 3-frame GIF that catches the eye without being spammy).
  - [ ] **Gallery Images**: 5–7 slides (1270x760px). Show actual product workflows, not generic marketing graphics.
  - [ ] **Demo Video**: 60-second YouTube or Loom embed highlighting the end-to-end workflow.
  - [ ] **Launch Offer**: PH-exclusive perk (e.g., *"Use code PHLAUNCH for 20% off or bonus credits"*).

#### 2. Social Media Staging (Drafted & Reviewed)
- [ ] **Twitter / X Thread**: Full 5–7 tweet sequence drafted and media attached (GIFs/MP4s).
- [ ] **LinkedIn Post**: Written for personal founder profile + company page, paired with a PDF document carousel or 16:9 demo video.
- [ ] **Reddit Posts**: Drafted customized copy tailored to individual subreddit culture and strict rules.
- [ ] **Instagram Content**:
  - [ ] 1x 9:16 Reel (Fast-paced hook: "Stop guessing your Midjourney prompts").
  - [ ] 1x 1:1 or 4:5 Carousel (Before / Breakdown / After).
  - [ ] Story sequence ready with link sticker.

#### 3. War Room & Operational Readiness
- [ ] Dedicated internal Slack/Discord channel (`#launch-war-room`).
- [ ] Roster assignments: Who monitors Product Hunt comments, who handles Twitter mentions, who fields support bugs.
- [ ] Rollback and failover plan documented (AI Kill Switch & Pause Sign-ups at `/admin`).

---

### Phase 3: Launch Day Execution (T-0 Hour-by-Hour)

#### ⏰ 12:01 AM PT — The Product Hunt Drop
- [ ] **Submit / Publish Listing**: Listing goes live at exactly 12:01 AM PT.
- [ ] **Post Maker's First Comment (within 5 minutes)**:
  ```markdown
  Hey Product Hunt! 👋 I'm [Name], creator of Anyref.

  We built Anyref out of pure frustration: every time our team saw an incredible marketing reference poster, we spent hours guessing the lighting, camera angles, and layout in Midjourney/Flux, only to end up with unbranded hallucinations.

  Anyref fixes this workflow:
  1. 🖼️ Drop any reference poster: AI breaks down layout, lighting, and composition into structured slots.
  2. 🎨 Inject Brand DNA: Your logos, colors, and slogans auto-populate into brand rules.
  3. 🛡️ Guardrails: Prices, discounts, and dates are never hallucinated.
  4. 📋 Attach in flow: Ready-to-paste prompts with exact multi-image asset order.
  5. 🏆 Winner Vault: Zero-cost prompt reuse for approved winning designs.

  🎁 Special for PH: Use code PHLAUNCH for [exclusive perk/extended trial].

  I'll be here all 24 hours answering questions, taking feature requests, and fixing bugs live. Would love your honest feedback!
  ```
- [ ] **Email Cohort #1 (VIPs / Beta Users)**: Notify your closest supporters that you are live on PH (ask for *feedback*, never explicitly ask for "upvotes").

#### ⏰ 06:30 AM PT — The Twitter/X & LinkedIn Wave
*US East Coast wakes up; European afternoon peak.*

- [ ] **Twitter / X Launch Thread**:
  - **Tweet 1 (Hook)**: Problem + Solution + 15s video showing the core transformation + Product Hunt link.
  - **Tweet 2 (The Breakdown)**: Show how it works step-by-step with screenshots.
  - **Tweet 3 (The Guardrails)**: Explain why zero hallucination & brand DNA matters.
  - **Tweet 4 (The Offer & Link)**: Direct link to app + link to PH discussion thread.
  - **Tweet 5 (Engagement Ask)**: *"If you're an AI creator or marketer, RT the first tweet to share with your network."*
- [ ] **LinkedIn Founder Post**:
  - **Hook**: *"Most design teams spend 8+ hours a week reverse-engineering visual references into AI prompts. Today, we're fixing that."*
  - **Body**: Brief founding story, lessons learned, and the business impact of workflow automation.
  - Attach a **PDF Carousel** (or video demo) for high LinkedIn dwell time.
  - Add link in the comments or bottom of the post.

#### ⏰ 08:30 AM PT — Reddit Community Value Drops
*Never cross-post identical corporate copy to Reddit.*

- [ ] **Subreddit 1: `r/SideProject`**:
  - **Title**: *"[Show r/SideProject] I spent 3 months building a tool that turns reference posters into brand-safe Midjourney prompts. Here's the architecture and what I learned."*
  - **Content**: Technical details (Next.js, Supabase, AI vision models), obstacles faced, free link to test, and an ask for feedback.
- [ ] **Subreddit 2: `r/SaaS` or `r/Entrepreneur`**:
  - **Angle**: Product validation, pricing experiments, and the go-to-market journey.
- [ ] **Subreddit 3: `r/Midjourney` / `r/StableDiffusion`**:
  - Share pure value: A breakdown of how to extract camera/lighting parameters from real posters with examples of generated results.

#### ⏰ 10:00 AM PT — Instagram Visual Showcase
- [ ] **Publish Reel**: Highlighting a split-screen or rapid cut: Reference poster on left ➔ Prompt structure ➔ Midjourney final output.
- [ ] **Publish Carousel**: Slide 1: "The anatomy of a winning brand poster prompt."
- [ ] **Instagram Stories**:
  - Story 1: Behind-the-scenes war room desk photo.
  - Story 2: "We're live on Product Hunt! Check link in bio."
  - Story 3: Re-sharing user reactions and shoutouts.

#### ⏰ All Day Long (T+2h to T+24h) — Engagement Discipline
- [ ] **Zero Comment Left Behind**: Respond to every Product Hunt, Twitter, LinkedIn, and Reddit comment within 15–30 minutes.
- [ ] **Milestone Celebrations**:
  - Tweet updates when hitting milestones (*"Trending in the top 5 on Product Hunt!"*, *"Passed 500 signups in 4 hours!"*).
- [ ] **Live Bug Squashing**: If a user reports a bug, patch it immediately and reply: *"Fixed in production. Thanks for catching that!"*

---

### Phase 4: Post-Launch Momentum (Days 2 to 30)

- [ ] **Day 2 (Follow-up & Transparency)**:
  - Post a transparent "Launch Day Post-Mortem" on Twitter and LinkedIn (*"24 Hours After Launch: What went well, what broke, and total numbers"*).
- [ ] **Day 3–5 (Social Proof & Testimonials)**:
  - Screenshot positive PH and Twitter feedback and turn them into testimonial cards on your landing page.
- [ ] **Day 7 (AI Directory Blast)**:
  - Submit product to curated AI directories:
    - *Futurepedia, There's An AI For That, Toolify, AlternativeTo, SaaSHub*.
- [ ] **Day 14 (Case Study / Early Adopter Spotlight)**:
  - Publish a mini-case study showing how an agency or designer created a 5-poster campaign using Anyref in 10 minutes.
- [ ] **Day 30 (Full Retrospective)**:
  - Calculate user retention, activation rate, and conversion-to-paid.
  - Document learnings into your team's permanent launch playbook.

---

## 5. Launch Success Metrics & Targets

| Metric | Target (Good) | Target (Exceptional) | Tool / Source |
| :--- | :--- | :--- | :--- |
| **Product Hunt Rank** | Top 5 of the Day *(Badge)* | Top 3 / Product of the Day | Product Hunt Leaderboard |
| **PH Upvotes & Reviews** | 250+ upvotes, 40+ comments | 500+ upvotes, 100+ comments | PH Dashboard |
| **Landing Page Visitors** | 2,500–5,000 unique | 10,000+ unique | GA4 / Telemetry |
| **Visitor-to-Signup Rate** | 8% – 12% | 15%+ | Product Analytics |
| **Twitter / X Impressions** | 25,000+ impressions | 100,000+ impressions | X Analytics |
| **Day-7 User Retention** | 20%+ active | 35%+ active | Database / PostHog |

---

## 6. Critical Guardrails & Pitfalls to Avoid

> [!CAUTION]
> **Do not ask for upvotes directly:** Product Hunt algorithms detect sudden referral traffic asking for "upvotes" and will penalize or de-rank your product. Always ask for **"feedback"** and link to your product page or direct search query.

> [!WARNING]
> **Never copy-paste promotional links into Reddit:** Subreddits will instantly ban accounts that dump promotional links without contributing value. Always offer open workflows, prompt breakdowns, or architecture lessons.

> [!TIP]
> **Stagger social announcements:** Do not publish everywhere at the exact same minute. Start with Product Hunt at midnight PT, follow with Twitter and LinkedIn at East Coast waking hours (6:30–7:00 AM PT), and roll out Reddit once initial engagement is humming.
