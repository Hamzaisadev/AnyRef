import { contrastPairs } from '../src/lib/landing/tokens';

function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '').trim();
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const sRGB = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * sRGB[0]! + 0.7152 * sRGB[1]! + 0.0722 * sRGB[2]!;
}

function getContrastRatio(colorA: string, colorB: string): number {
  const lum1 = getLuminance(colorA);
  const lum2 = getLuminance(colorB);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function runContrastCheck() {
  console.log('=== WCAG Contrast Verification ===\n');
  let hasFailure = false;

  for (const pair of contrastPairs) {
    const ratio = getContrastRatio(pair.text, pair.background);
    const passed = ratio >= pair.minRatio;
    const formattedRatio = ratio.toFixed(2) + ':1';
    const status = passed ? 'PASS' : 'FAIL';

    console.log(
      `[${status}] ${pair.name.padEnd(35)} | Text: ${pair.text} | Bg: ${pair.background} | Ratio: ${formattedRatio.padEnd(8)} (Min: ${pair.minRatio}:1)`
    );

    if (!passed) {
      hasFailure = true;
    }
  }

  console.log('\n==================================');
  if (hasFailure) {
    console.error('FAILED: One or more color pairs failed WCAG contrast check.');
    process.exit(1);
  } else {
    console.log('SUCCESS: All color pairs meet or exceed WCAG contrast thresholds.');
    process.exit(0);
  }
}

runContrastCheck();
