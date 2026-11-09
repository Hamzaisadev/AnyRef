import { describe, it, expect } from 'vitest';
import {
  checkPassword,
  normalizeEmail,
  PASSWORD_MIN,
  PASSWORD_MAX,
} from '@/services/passwordPolicy';

describe('checkPassword', () => {
  it('accepts a long ordinary passphrase', () => {
    const r = checkPassword('correct horse battery staple');
    expect(r.ok).toBe(true);
    expect(r.problems).toEqual([]);
  });

  it('accepts a shorter password that mixes character classes', () => {
    expect(checkPassword('Tr0ubador!x').ok).toBe(true);
  });

  it(`rejects anything under ${PASSWORD_MIN} characters`, () => {
    const r = checkPassword('Sh0rt!');
    expect(r.ok).toBe(false);
    expect(r.problems[0]).toMatch(/at least/i);
  });

  it(`rejects anything over ${PASSWORD_MAX} characters, rather than silently truncating`, () => {
    // bcrypt ignores bytes past 72, so a longer password would give a false sense of
    // security and would not match on a client that trims differently.
    const r = checkPassword('a'.repeat(PASSWORD_MAX + 1) + 'B1!');
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => /under/i.test(p))).toBe(true);
  });

  it.each(['password123', 'qwertyuiop', 'letmein123', 'p@ssw0rd', 'anyref123'])(
    'rejects the common password %s',
    (pw) => {
      const r = checkPassword(pw);
      expect(r.ok).toBe(false);
      expect(r.score).toBe(0);
    }
  );

  it('rejects a password containing the email local part', () => {
    const r = checkPassword('hamzaisadev2026', 'hamzaisadev@gmail.com');
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => /email/i.test(p))).toBe(true);
  });

  it('rejects a single repeated character', () => {
    const r = checkPassword('aaaaaaaaaaaa');
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => /same character/i.test(p))).toBe(true);
  });

  it.each(['abcdefghij', 'qwertyuiop', '0123456789'])('rejects the run %s', (pw) => {
    expect(checkPassword(pw).ok).toBe(false);
  });

  it('rejects a reversed keyboard run', () => {
    expect(checkPassword('poiuytrewq').ok).toBe(false);
  });

  it('requires more than one character class below 16 characters', () => {
    const r = checkPassword('abcdplwnqx'); // 10 chars, lowercase only, not a run
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => /number, a capital, or a symbol/i.test(p))).toBe(true);
  });

  it('allows a long single-class passphrase, because length carries the entropy', () => {
    expect(checkPassword('verylongquietpassphrase').ok).toBe(true);
  });

  it('scores from 0 to 4 and never outside it', () => {
    for (const pw of ['', 'a', 'password', 'Tr0ubador!x', 'correct horse battery staple ok']) {
      const s = checkPassword(pw).score;
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(4);
    }
  });

  it('gives a compromised password a score of zero even if it is long', () => {
    expect(checkPassword('passw0rd').score).toBe(0);
  });
});

describe('normalizeEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmail('  Hamza@Example.COM ')).toBe('hamza@example.com');
  });

  it.each([null, undefined, 42, '', 'nope', 'a@b', 'no-at-sign.com', 'two@@at.com'])(
    'rejects %s',
    (bad) => {
      expect(normalizeEmail(bad)).toBeNull();
    }
  );

  it('accepts subdomains and plus addressing', () => {
    expect(normalizeEmail('a+tag@mail.example.co.uk')).toBe('a+tag@mail.example.co.uk');
  });

  it('rejects an address longer than the RFC limit', () => {
    expect(normalizeEmail(`${'a'.repeat(250)}@b.com`)).toBeNull();
  });
});
