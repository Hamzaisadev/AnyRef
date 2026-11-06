import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Claims Guard CI Test
 * Enforces that unverified market claims, speculative revenue forecasts, churn assumptions,
 * CAC, and LTV multiples from internal sizing hypotheses never leak into the product UI,
 * customer-facing components, or public README.
 */

const FORBIDDEN_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'TAM $1.42B figure', regex: /\$?\b1\.42B\b/i },
  { name: '1.5M countable entities', regex: /\b1,500,000\b/ },
  { name: 'SOM $3.1M ARR figure', regex: /\$?\b3\.(1|11|19|2|20)M\b/i },
  { name: 'Speculative Churn assumption', regex: /\bchurn\b/i },
  { name: 'Customer Acquisition Cost (CAC)', regex: /\bCAC\b/ },
  { name: 'Customer Lifetime Value (LTV)', regex: /\bLTV\b/ },
  { name: 'LTV:CAC ratio (3.0x / 3.01x)', regex: /\b3\.0[01]?x\b/i },
];

function getAllFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else if (
      entry.isFile() &&
      /\.(tsx?|jsx?|json|html|css|md)$/i.test(entry.name) &&
      !entry.name.endsWith('.d.ts')
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Claims Guard: Prevention of Unverified Market Claims in Product UI', () => {
  const rootDir = process.cwd();
  const srcDir = path.join(rootDir, 'src');
  const readmePath = path.join(rootDir, 'README.md');

  const fileContents = new Map<string, string[]>();

  beforeAll(() => {
    const allPaths = [...getAllFiles(srcDir), readmePath];
    for (const p of allPaths) {
      if (fs.existsSync(p)) {
        fileContents.set(p, fs.readFileSync(p, 'utf-8').split('\n'));
      }
    }
  }, 30000);

  it('verifies that files were collected and README.md is present', () => {
    expect(fileContents.size).toBeGreaterThan(10);
    expect(fs.existsSync(readmePath)).toBe(true);
  });

  for (const pattern of FORBIDDEN_PATTERNS) {
    it(`guarantees no leakage of ${pattern.name} in src/ and README.md`, () => {
      const violations: string[] = [];

      for (const [filePath, lines] of fileContents.entries()) {
        lines.forEach((line, index) => {
          if (pattern.regex.test(line)) {
            const relPath = path.relative(rootDir, filePath);
            violations.push(`${relPath}:${index + 1}: ${line.trim()}`);
          }
        });
      }

      expect(
        violations,
        `Forbidden unverified market claim found in product codebase:\n${violations.join('\n')}`
      ).toEqual([]);
    });
  }
});
