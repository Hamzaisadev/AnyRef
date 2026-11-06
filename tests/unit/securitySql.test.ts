import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getFilesRecursively(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFilesRecursively(fullPath, fileList);
    } else if (/\.(ts|tsx)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe('Security & Data Integrity Static Audits (Phase 3)', () => {
  const srcDir = path.resolve(__dirname, '../../src');
  const sourceFiles = getFilesRecursively(srcDir);
  const fileCache = new Map<string, string>();
  for (const filePath of sourceFiles) {
    try {
      fileCache.set(filePath, fs.readFileSync(filePath, 'utf-8'));
    } catch {
      // ignore
    }
  }

  it('contains zero instances of dangerouslySetInnerHTML', { timeout: 20000 }, () => {
    const violations: string[] = [];

    for (const [filePath, content] of fileCache) {
      if (content.includes('dangerouslySetInnerHTML')) {
        violations.push(filePath);
      }
    }

    expect(violations, `Found dangerouslySetInnerHTML in: ${violations.join(', ')}`).toEqual([]);
  });

  it('contains zero raw SQL string interpolations or dangerous .rpc concatenations', () => {
    const violations: string[] = [];
    const dangerousPatterns = [
      /\.rpc\s*\(\s*`/,
      /\.rpc\s*\([^,)]*\+/,
      /`\s*SELECT\s+.*FROM\s+/i,
      /`\s*INSERT\s+INTO\s+/i,
      /`\s*DELETE\s+FROM\s+/i,
      /`\s*DROP\s+TABLE/i,
      /"SELECT\s+.*FROM\s+.*"\s*\+/i,
    ];

    for (const [filePath, content] of fileCache) {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(content)) {
          violations.push(`${filePath} matches ${pattern.toString()}`);
        }
      }
    }

    expect(violations, `Found SQL concatenation violations: ${violations.join(', ')}`).toEqual([]);
  });

  it('strictly isolates client modules from server-only environment variables', { timeout: 20000 }, () => {
    const clientFiles: Array<{ path: string; content: string }> = [];
    for (const [filePath, content] of fileCache) {
      if (content.startsWith("'use client'") || content.startsWith('"use client"')) {
        clientFiles.push({ path: filePath, content });
      }
    }

    const forbiddenServerImports = [
      "from '@/lib/env'",
      'from "../lib/env"',
      "from '@/lib/supabaseServer'",
      'from "../lib/supabaseServer"',
      'GEMINI_API_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    const violations: string[] = [];
    for (const { path: filePath, content } of clientFiles) {
      for (const forbidden of forbiddenServerImports) {
        if (content.includes(forbidden)) {
          violations.push(`${filePath} directly accesses server secret: "${forbidden}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
