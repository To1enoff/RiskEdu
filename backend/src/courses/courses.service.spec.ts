import { describe, expect, it } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { normalizeAndValidateWeights } from './courses.service';

describe('normalizeAndValidateWeights', () => {
  it('validates that sum(weights) must equal 100', () => {
    expect(() =>
      normalizeAndValidateWeights({
        midterm: 30,
        final: 40,
        quizzes: 20,
        assignments: 5,
      }),
    ).toThrow(BadRequestException);
  });

  it('returns normalized weights when valid', () => {
    const normalized = normalizeAndValidateWeights({
      midterm: 30,
      final: 40,
      quizzes: 20,
      assignments: 10,
    });

    expect(normalized.midterm).toBe(30);
    expect(normalized.final).toBe(40);
    expect(normalized.quizzes).toBe(20);
    expect(normalized.assignments).toBe(10);
    expect(normalized.projects).toBe(0);
  });
});
