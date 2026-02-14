import { describe, expect, it } from '@jest/globals';
import { getRiskBucket } from './risk';

describe('getRiskBucket', () => {
  it('maps boundaries correctly', () => {
    expect(getRiskBucket(0.2)).toBe('green');
    expect(getRiskBucket(0.33)).toBe('yellow');
    expect(getRiskBucket(0.65)).toBe('yellow');
    expect(getRiskBucket(0.66)).toBe('red');
  });
});
