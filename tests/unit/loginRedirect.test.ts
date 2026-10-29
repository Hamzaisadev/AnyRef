import { describe, it, expect } from 'vitest';
import { sanitizeRedirectPath } from '@/lib/sanitizeRedirect';

describe('S2-13: Login redirectTo and next parameter alignment and open-redirect prevention', () => {
  it('allows safe relative paths', () => {
    expect(sanitizeRedirectPath('/workspace/autofill')).toBe('/workspace/autofill');
    expect(sanitizeRedirectPath('/entries/1234-5678')).toBe('/entries/1234-5678');
    expect(sanitizeRedirectPath('/brands?filter=active')).toBe('/brands?filter=active');
    expect(sanitizeRedirectPath('/library')).toBe('/library');
  });

  it('rejects protocol-relative and absolute URL open redirects', () => {
    // Protocol-relative (//evil.com)
    expect(sanitizeRedirectPath('//evil.com')).toBe('/library');
    expect(sanitizeRedirectPath('//attacker.org/phish')).toBe('/library');

    // Windows / backslash bypasses (/\evil.com, /\\evil.com)
    expect(sanitizeRedirectPath('/\\evil.com')).toBe('/library');
    expect(sanitizeRedirectPath('/\\/evil.com')).toBe('/library');
    expect(sanitizeRedirectPath('\\evil.com')).toBe('/library');

    // Absolute URLs
    expect(sanitizeRedirectPath('https://evil.com')).toBe('/library');
    expect(sanitizeRedirectPath('http://malicious.net/login')).toBe('/library');
    expect(sanitizeRedirectPath('javascript:alert(1)')).toBe('/library');
    expect(sanitizeRedirectPath('data:text/html,<script>alert(1)</script>')).toBe('/library');
  });

  it('defaults to /library when parameter is null, undefined, or empty', () => {
    expect(sanitizeRedirectPath(null)).toBe('/library');
    expect(sanitizeRedirectPath(undefined)).toBe('/library');
    expect(sanitizeRedirectPath('')).toBe('/library');
    expect(sanitizeRedirectPath('   ')).toBe('/library');
  });
});
