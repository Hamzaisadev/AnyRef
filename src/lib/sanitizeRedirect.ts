/**
 * Sanitizes an incoming redirect path to strictly prevent open redirect vulnerabilities.
 * Ensures the target is a same-origin relative path starting with a single '/'
 * and containing no protocol, host, backslash, or control sequences.
 */
export function sanitizeRedirectPath(path: string | null | undefined, fallback: string = '/library'): string {
  if (!path || typeof path !== 'string') {
    return fallback;
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return fallback;
  }

  // Must begin with a single '/' and not '//' or '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // Disallow backslashes anywhere in the path (can be abused in some browser parsers)
  if (trimmed.includes('\\')) {
    return fallback;
  }

  // Disallow explicit URI schemes (e.g., javascript:, data:, https:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}
