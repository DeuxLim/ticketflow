import { describe, expect, it } from 'vitest';
import { selectorCoverageHint } from './selectorCoverage';

describe('selectorCoverageHint', () => {
  it('returns null when total count is missing', () => {
    expect(selectorCoverageHint(10, undefined, 'customers')).toBeNull();
    expect(selectorCoverageHint(10, null, 'customers')).toBeNull();
  });

  it('returns null when loaded count already covers total', () => {
    expect(selectorCoverageHint(10, 10, 'customers')).toBeNull();
    expect(selectorCoverageHint(11, 10, 'customers')).toBeNull();
  });

  it('returns coverage hint when total is greater than loaded', () => {
    expect(selectorCoverageHint(200, 480, 'customers')).toBe('Showing first 200 of 480 customers.');
    expect(selectorCoverageHint(150, 300, 'tickets')).toBe('Showing first 150 of 300 tickets.');
  });
});
