import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://anyref.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/guides',
          '/guides/*',
          '/library',
          '/privacy',
          '/terms',
          '/brand/*',
          '/llms.txt',
          '/llms-full.txt',
        ],
        disallow: ['/admin', '/admin/*', '/api/*', '/workspace/*', '/settings', '/billing'],
      },
      {
        userAgent: [
          'Googlebot',
          'OAI-SearchBot',
          'Claude-SearchBot',
          'Claude-User',
          'PerplexityBot',
          'Perplexity-User',
          'GPTBot',
          'ClaudeBot',
          'Google-Extended',
          'Applebot-Extended',
        ],
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
