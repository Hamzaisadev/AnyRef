export const nav = {
  links: [
    { label: 'How it works', id: 'how-it-works' },
    { label: 'Guardrails', id: 'guardrails' },
    { label: 'Brands', id: 'brands' },
    { label: 'Pricing', id: 'pricing' },
    { label: 'FAQ', id: 'faq' },
  ],
  signIn: 'Sign in',
  cta: 'Start free',
  skip: 'Skip to content',
  menuOpen: 'Open menu',
  menuClose: 'Close menu',
} as const;

export const hero = {
  titleLine1: 'Any reference. Your brand.',
  titleLine2: 'Ready to prompt.',
  subline:
    'Drop in a poster you love. Anyref turns it into a reusable prompt with your colors, your words and your product.',
  primaryCta: 'Deconstruct a poster',
  secondaryCta: 'See how it works',
  proof: 'You make the image in your own tool. Anyref never touches it.',
  scrollCue: 'Scroll',
} as const;

export const demoBrands = {
  a: {
    id: 'a',
    label: 'Example brand A',
    wordmark: 'FAJAR',
    headline: 'WARM NIGHTS SALE',
    subhead: 'Hand-poured soy candles',
    offer: '20% OFF',
    cta: 'SHOP NOW',
    footer: 'Free delivery',
    colors: { primary: '#B4531E', soft: '#F6E7D6', dark: '#2A1710', accent: '#F2B45A' },
  },
  b: {
    id: 'b',
    label: 'Example brand B',
    wordmark: 'NILA',
    headline: 'FRESH HARVEST',
    subhead: 'Loose-leaf tea from the hills',
    offer: 'BUY 2 GET 1',
    cta: 'ORDER NOW',
    footer: 'Fast delivery',
    colors: { primary: '#1F6B4F', soft: '#E4F1E8', dark: '#0F2A20', accent: '#E8C24A' },
  },
} as const;

export const promptDemo = {
  title: 'Prompt',
  status: '6 blanks, 1 attachment',
  attachTitle: 'Attach in this order',
  attachItems: ['Product photo'],
  copy: 'Copy prompt',
  copied: 'Copied',
  // segments: text, or a slot with its key and kind (brand = from your brand, campaign = you fill it)
  segments: [
    { t: 'text', v: 'Vertical 4:5 finished advertisement poster, two-tone layout with a large curved light shape on the left and a solid deep field on the right. Subject: the exact product in the attached product image, reproduced faithfully and unchanged, shown large on the right, slightly angled, with a soft shadow beneath it. Headline in bold sans-serif capitals, top-left: ' },
    { t: 'slot', key: 'headline', kind: 'campaign' },
    { t: 'text', v: '. One short line beneath it: ' },
    { t: 'slot', key: 'subhead', kind: 'campaign' },
    { t: 'text', v: '. Rounded badge, left-center: ' },
    { t: 'slot', key: 'offer', kind: 'campaign' },
    { t: 'text', v: '. Rounded button, lower-left: ' },
    { t: 'slot', key: 'cta', kind: 'campaign' },
    { t: 'text', v: '. Small wordmark, top-right: ' },
    { t: 'slot', key: 'wordmark', kind: 'brand' },
    { t: 'text', v: '. Small text, bottom-right: ' },
    { t: 'slot', key: 'footer', kind: 'brand' },
    { t: 'text', v: '. Colors: the brand primary color and white. Soft directional studio light from the top-left. No extra text, no random letters, no watermark.' },
  ],
  legend: { brand: 'From your brand', campaign: 'You fill in', layout: 'Layout, stays fixed' },
} as const;

export const LANDING_CONTENT = {
  nav: {
    links: [
      { href: '#how-it-works', label: 'How it works' },
      { href: '#guardrails', label: 'Guardrails' },
      { href: '#brands', label: 'Brands' },
      { href: '#pricing', label: 'Pricing' },
      { href: '#faq', label: 'FAQ' },
    ],
    startFree: {
      href: '/login?next=/workspace/generate',
      label: 'Start free',
    },
    signIn: 'Sign in',
    skip: 'Skip to content',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
  },
  hero: {
    titleLine1: 'Any reference. Your brand.',
    titleLine2: 'Ready to prompt.',
    subline:
      'Drop in a poster you love. Anyref turns it into a reusable prompt with your colors, your words and your product.',
    primaryCta: {
      href: '/login?next=/workspace/generate',
      label: 'Start free',
    },
    secondaryCta: 'See how it works',
    proofLine: 'Anyref never invents a price, a discount, or a date. Those are always yours to fill in.',
    scrollCue: 'Scroll',
  },
  howItWorks: {
    cta: {
      href: '/login?next=/workspace/generate',
      label: 'Start free',
    },
  },
  pricing: {
    eyebrow: 'PRICING',
    h2: 'Simple, transparent pricing',
    noteBelow: 'Renders finished posters in-app. Export the prompt to Midjourney or Flux instead whenever you prefer.',
    freeCard: {
      title: 'Free',
      subline: 'For individuals getting started',
      cta: {
        href: '/login?next=/workspace/generate',
        label: 'Start free',
      },
      limits: {
        maxBrands: 1,
        maxEntries: 25,
        generatePerDay: 3,
        autofillPerDay: 3,
        storageMb: 200,
      },
      // Keep in sync with DEFAULT_FREE_LIMITS; landingPage.test.ts asserts equality.
      features: [
        '3 finished posters per month',
        '1 brand',
        '25 saved entries',
        '3 prompt generations per day',
        '3 product autofills per day',
        'Standard community support',
      ],
    },
    proCard: {
      title: 'Pro',
      buttonLabel: 'Upgrade to Pro',
      bullets: [
        '30 finished posters per month',
        'Up to 5 brands',
        'Unlimited saved templates in library',
        'Batch multi-image processing',
        'Priority queue processing',
      ],
    },
    studioCard: {
      title: 'Studio',
      subline: 'For heavy creators and solo visual directors',
      buttonLabel: 'Coming soon',
      bullets: [
        '100 finished posters per month',
        'Up to 25 brands',
        'Highest daily throughput allocation',
        'Advanced visual deconstruction controls',
        'Dedicated export queue profiles',
        'Direct creator support channel',
      ],
    },
  },
  finalCta: {
    cta: {
      href: '/login?next=/workspace/generate',
      label: 'Start free',
    },
  },
  faq: {
    items: [
      {
        question: 'Does Anyref generate images directly?',
        answer: 'Yes. Anyref renders the finished poster in-app, so you never have to copy a prompt into another tool. You can still export the prompt to Midjourney, Flux, or Ideogram if you prefer to generate there.',
      },
      {
        question: 'How does reference poster deconstruction work?',
        answer: 'Anyref analyzes the reference poster composition, camera lighting, visual depth, and graphic layout hierarchy to construct a prompt.',
      },
      {
        question: 'Can I use my own product photos?',
        answer: 'Yes. Simply upload your product photo and Anyref analyzes its silhouette and details to feature it as the hero subject.',
      },
      {
        question: 'What image tools can I use with these prompts?',
        answer: 'Anyref renders posters in-app by default. Exported prompts are also tuned for Midjourney, Flux, Ideogram, and general diffusion engines.',
      },
      {
        question: 'Do you store my uploaded product photos permanently?',
        answer: 'No, product photos used for autofill are processed ephemerally in memory and are never persisted to long-term storage.',
      },
      {
        question: 'Can I edit the generated prompt before generating?',
        answer: 'Yes, you have full real-time in-place editing control over headline, offer badge, call to action, and accent color.',
      },
      {
        question: 'Is there a free tier available for creators?',
        answer: 'Yes, our Free plan provides daily prompt generations and product autofills at no financial cost to get started immediately.',
      },
      {
        question: 'How do brand guidelines keep prompts consistent?',
        answer: 'Your saved brand colors, typography wordmarks, and tone are automatically slotted into every generated prompt seamlessly.',
      },
    ],
  },
  footer: {
    links: [
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/guides', label: 'Integration Guides' },
      { href: '/login', label: 'Account Sign In' },
    ],
  },
} as const;

