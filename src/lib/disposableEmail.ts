/**
 * Disposable email domain blocklist for Anyref public sign-ups.
 * Prevents automated throwaway account spam and bot abuse.
 */
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'throwawaymail.com',
  'yopmail.com',
  'sharklasers.com',
  'grr.la',
  'guerrillamailblock.com',
  'pokemail.net',
  'dispostable.com',
  'fakeinbox.com',
  'trashmail.com',
  'getairmail.com',
  'crazymailing.com',
  'burnermail.io',
  'mohmal.com',
  'inboxkitten.com',
  'maildrop.cc',
]);

/**
 * Validates if an email address uses a known disposable email domain.
 * @param email Email address to verify
 * @returns true if disposable, false if legitimate
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.trim().toLowerCase().split('@').pop();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}
