/**
 * All landing-page content in one file.
 *
 * Honesty rules enforced here (the product has no users yet):
 *  - no testimonials, client logos, award badges or usage metrics
 *  - every example brand is fictional and marked `placeholder: true`
 *  - the only real numbers are the plan prices, read from PLANS_CONFIG
 */
import { PLANS_CONFIG } from '@/config/plans';

export const site = {
  name: 'Anyref',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://anyref.app',
  description:
    'Anyref turns any reference image into a finished, on-brand marketing poster. Your colours, your logo, your words, every time.',
} as const;

/**
 * The five brand inks the colour rail switches between.
 * `fieldInk` is precomputed per ink so text on the field always passes AA; never derive
 * it at runtime.
 */
export interface Ink {
  name: string;
  field: string;
  /** Text colour on `field`. Precomputed per ink; never derive at runtime. */
  fieldInk: string;
  /** A darker shade of the ink, used for the tinted poster and button fills. */
  fieldDeep: string;
  /** Text colour on `fieldDeep`. Separate from fieldInk: a dark ink that passes on
   *  the bright field can fail on the deep one (ember measured 3.57:1). */
  deepInk: string;
}

export const INKS: Ink[] = [
  { name: 'Ember', field: '#FF4D2E', fieldInk: '#1A0B06', fieldDeep: '#A62612', deepInk: '#FFFFFF' },
  { name: 'Cobalt', field: '#1B4DFF', fieldInk: '#FFFFFF', fieldDeep: '#0B2DAD', deepInk: '#FFFFFF' },
  { name: 'Fern', field: '#0E8F5E', fieldInk: '#FFFFFF', fieldDeep: '#065038', deepInk: '#FFFFFF' },
  { name: 'Violet', field: '#7B2FF2', fieldInk: '#FFFFFF', fieldDeep: '#44158F', deepInk: '#FFFFFF' },
  { name: 'Amber', field: '#F2B705', fieldInk: '#241A00', fieldDeep: '#8A6700', deepInk: '#FFFFFF' },
];

/**
 * Posters. Fictional brands so the layout is visible; every one is labelled in the UI
 * and marked here for replacement with real customer work.
 *
 * The photography is free-license (Unsplash), credited in the footer colophon and
 * listed in public/landing/credits.json. It stands in for a customer's own product
 * shots and should be replaced along with the brands.
 */
export interface Poster {
  placeholder: true;
  brand: string;
  kicker: string;
  headline: string;
  price: string;
  foot: string;
  /** Product photograph. Real imagery, not a shape drawn in CSS. */
  src: string;
  alt: string;
  /** Where the subject sits, so the headline never lands on it. */
  focus: string;
  /** Paper-side posters carry their own ground; field-side ones inherit the ink. */
  bg: string;
  ink: string;
  accent: string;
  kind: string;
}

export const heroPosters: Poster[] = [
  {
    placeholder: true,
    brand: 'Verda',
    kicker: 'Spring',
    headline: 'Everything greener',
    price: '20% off',
    foot: 'Open 9 till 6',
    src: '/landing/696.jpg',
    alt: 'Orange tulips in a flower bed',
    focus: '50% 38%',
    bg: '#FBF7F0',
    ink: '#15130F',
    accent: '#0E8F5E',
    kind: 'Garden centre',
  },
  {
    placeholder: true,
    brand: 'Nomad',
    kicker: 'New roast',
    headline: 'Morning, properly',
    price: 'From $14',
    foot: 'Ships Tuesday',
    src: '/landing/766.jpg',
    alt: 'Dark roasted coffee beans filling the frame',
    focus: '50% 42%',
    bg: '#15130F',
    ink: '#FBF7F0',
    accent: '#F2B705',
    kind: 'Coffee roaster',
  },
];

export const proofPosters: Poster[] = [
  {
    placeholder: true,
    brand: 'Hearth',
    kicker: 'Winter menu',
    headline: 'Something warm',
    price: '$6 a cup',
    foot: 'Open till late',
    src: '/landing/755.jpg',
    alt: 'Mittened hands holding a steaming white mug',
    focus: '50% 45%',
    bg: '#15130F',
    ink: '#FBF7F0',
    accent: '#FF4D2E',
    kind: 'Coffee shop',
  },
  {
    placeholder: true,
    brand: 'Pell & Co',
    kicker: 'Easter bake',
    headline: 'Out of the oven',
    price: '3 for $9',
    foot: 'Bakes daily',
    src: '/landing/835.jpg',
    alt: 'Almond biscuits in a bowl beside daffodils and lemon slices',
    focus: '60% 55%',
    bg: '#1B4DFF',
    ink: '#FFFFFF',
    accent: '#F2B705',
    kind: 'Bakery',
  },
  {
    placeholder: true,
    brand: 'Fold',
    kicker: 'Summer',
    headline: 'Fresh pressed',
    price: '40% off',
    foot: 'Ends Sunday',
    src: '/landing/824.jpg',
    alt: 'A pineapple standing in a field of grass under a blue sky',
    focus: '66% 55%',
    bg: '#F2ECE1',
    ink: '#15130F',
    // Amber, not violet: the price pill sets ink on the accent, and #7B2FF2 measured
    // 3.11:1 against it. Every accent here must clear 4.5:1 with #15130F.
    accent: '#F2B705',
    kind: 'Juice bar',
  },
];

/** Photo credits for the colophon. Mirrors public/landing/credits.json. */
export const photoCredits = [
  { author: 'Padurariu Alexandru', href: 'https://unsplash.com/photos/mqyMjCTWJyQ' },
  { author: 'Padurariu Alexandru', href: 'https://unsplash.com/photos/k0SwnevO_wk' },
  { author: 'Pineapples', href: 'https://unsplash.com/photos/t-W4_309hi8' },
  { author: 'Leigh Kendell', href: 'https://unsplash.com/photos/-So60UAgCtU' },
  { author: 'Olenka Kotyk', href: 'https://unsplash.com/photos/eqsEZNCm4-c' },
] as const;

export const steps = [
  {
    n: '01',
    title: 'Drop a reference',
    body: 'Any poster you like the look of. Anyref reads its layout, lighting and hierarchy, not its text or logos.',
  },
  {
    n: '02',
    title: 'Pick the brand',
    body: 'Your colours, wordmark and tone, saved once. Describe your business in a sentence and Anyref drafts the rest for you to check.',
  },
  {
    n: '03',
    title: 'Get the poster',
    body: 'Rendered in the app, ready to post. Approve one and it becomes a template you can refill with new copy at no cost.',
  },
] as const;

/** The honesty guarantee, stated as a calm promise rather than a warning. */
export const honesty = {
  fills: {
    title: 'What it fills in',
    items: [
      'Layout, composition and lighting from your reference',
      'Your brand colours, wordmark and tone of voice',
      'Headlines and body copy, drafted for you to edit',
      'Your product photo, cut out and placed',
    ],
  },
  asks: {
    title: 'What it asks you for',
    items: [
      'Prices and any currency amount',
      'Discounts and percentages off',
      'Dates and deadlines',
      'Anything else a customer could hold you to',
    ],
    note: 'These are the four things an image model is happy to guess at, and the four you would have to stand behind. Anyref leaves them to you and will not render until they are filled.',
  },
} as const;

/** Prices come from the authoritative plan config, so the page cannot contradict the database. */
export const pricing = {
  free: {
    name: PLANS_CONFIG.free.name,
    price: PLANS_CONFIG.free.priceUsdMonth,
    renders: PLANS_CONFIG.free.limits.render_per_month,
    brands: PLANS_CONFIG.free.limits.max_brands,
    lines: ['No card. Nothing to cancel.', 'One brand, kept as long as you want it.'],
  },
  pro: {
    name: PLANS_CONFIG.pro.name,
    price: PLANS_CONFIG.pro.priceUsdMonth,
    priceYear: PLANS_CONFIG.pro.priceUsdYear,
    renders: PLANS_CONFIG.pro.limits.render_per_month,
    brands: PLANS_CONFIG.pro.limits.max_brands,
    lines: [
      'Five brands, which is the point if you run client work.',
      'Approved templates refill with new copy at no AI cost.',
    ],
  },
  studio: {
    name: PLANS_CONFIG.studio.name,
    price: PLANS_CONFIG.studio.priceUsdMonth,
    renders: PLANS_CONFIG.studio.limits.render_per_month,
    brands: PLANS_CONFIG.studio.limits.max_brands,
    lines: ['Twenty five brands.', 'Opens when Pro users ask for it.'],
  },
} as const;

/**
 * Who it is for. Three honest reads rather than invented personas: each names a real
 * situation and what changes, without claiming anyone uses it yet.
 */
export const audiences = [
  {
    title: 'You run several clients',
    body:
      'Each brand is saved once with its own colours, wordmark and tone. Switching client is a dropdown, not a folder of half-remembered hex codes.',
    detail: 'Five brands on Pro',
  },
  {
    title: 'You are the whole marketing team',
    body:
      'Describe the business in a sentence and Anyref drafts the brand for you to correct. You are editing something, not staring at a blank canvas.',
    detail: 'One brand free',
  },
  {
    title: 'You post more than you design',
    body:
      'Approve a poster once and it becomes a template. Next week you change the words and re-render, and the layout you already liked stays exactly as it was.',
    detail: 'Refills cost nothing',
  },
] as const;

/** What the product deliberately does not do. Said plainly, not as a feature list. */
export const limits = {
  title: 'What it is not',
  items: [
    {
      k: 'Not a design tool',
      v: 'There is no canvas and no layer panel. If you want to nudge a headline two pixels left, export the prompt and finish it somewhere else.',
    },
    {
      k: 'Not a stock library',
      v: 'You bring the reference and the product photo. Anyref reads the layout of one and places the other.',
    },
    {
      k: 'Not a scheduler',
      v: 'It makes the image and hands it to you. Posting it is still your job, in whatever tool you already use.',
    },
  ],
} as const;

export const faq = [
  {
    q: 'Does it make the image, or just the prompt?',
    a: 'It renders the finished poster in the app. You can also export the prompt to Midjourney, Flux or Ideogram if you would rather generate there.',
  },
  {
    q: 'Will it invent a price or a sale date?',
    a: 'No. Those fields are yours to fill. If one is empty, or holds something like TBD or $XX, the render stops and asks you instead of guessing.',
  },
  {
    q: 'Can I use a poster I found online as the reference?',
    a: 'As a layout guide, yes. Anyref reads composition and hierarchy, never the original text or logos. You are responsible for the rights to anything you upload.',
  },
  {
    q: 'What happens when I run out of renders?',
    a: 'Saved templates keep refilling with new copy at no cost, and prompt export keeps working. Only new AI renders pause until the month resets.',
  },
] as const;

export const nav = [
  { label: 'How it works', href: '#how' },
  { label: 'Examples', href: '#examples' },
  { label: 'Pricing', href: '#pricing' },
] as const;
