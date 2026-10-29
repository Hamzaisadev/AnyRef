import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 8 Hardening: SSRF Prevention Static Audit', () => {
  const apiDir = path.resolve(__dirname, '../../src/app/api');
  const servicesDir = path.resolve(__dirname, '../../src/services');

  function getAllFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        getAllFiles(filePath, fileList);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        fileList.push(filePath);
      }
    }
    return fileList;
  }

  it('guarantees zero user-supplied URL fetching across all API routes (SSRF immunity)', () => {
    const apiFiles = getAllFiles(apiDir);
    expect(apiFiles.length).toBeGreaterThan(0);

    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Reject patterns where fetch() is passed a variable derived directly from request body or query params
      const dynamicFetchRegex = /fetch\s*\(\s*(body\.\w+|params\.\w+|url|requestUrl|userUrl|targetUrl)\s*[,)]/i;
      expect(content).not.toMatch(dynamicFetchRegex);
    }
  });

  it('verifies outbound network calls are strictly restricted to trusted platform providers', () => {
    const serviceFiles = getAllFiles(servicesDir);
    const trustedHosts = [
      'generativelanguage.googleapis.com',
      'supabase.co',
    ];

    for (const file of serviceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const fetchMatches = content.matchAll(/fetch\s*\(\s*[`'"](https?:\/\/[^`'"]+)[`'"]/g);
      for (const match of fetchMatches) {
        const urlStr = match[1];
        if (urlStr) {
          const isTrusted = trustedHosts.some((host) => urlStr.includes(host));
          expect(isTrusted).toBe(true);
        }
      }
    }
  });
});
