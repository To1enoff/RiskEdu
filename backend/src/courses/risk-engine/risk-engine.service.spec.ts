import { describe, expect, it } from '@jest/globals';
import { RiskEngineService } from './risk-engine.service';

describe('RiskEngineService', () => {
  const service = new RiskEngineService();

  it('marks auto fail when absences > 30', () => {
    const result = service.calculate({
      weightedPercent: 75,
      remainingWeight: 20,
      maxAchievablePercent: 95,
      totalAbsences: 31,
      missingWeeksCount: 0,
      examCompletedRatio: 1,
      quizTrend: 0,
      allComponentsCompleted: false,
    });

    expect(result.isAutoFail).toBe(true);
    expect(result.probabilityFail).toBe(1);
    expect(result.bucket).toBe('red');
  });

  it('marks auto fail when impossible to recover', () => {
    const result = service.calculate({
      weightedPercent: 20,
      remainingWeight: 20,
      maxAchievablePercent: 40,
      totalAbsences: 5,
      missingWeeksCount: 5,
      examCompletedRatio: 0.5,
      quizTrend: -0.3,
      allComponentsCompleted: false,
    });

    expect(result.isAutoFail).toBe(true);
    expect(result.probabilityFail).toBe(1);
    expect(result.bucket).toBe('red');
    expect(result.reasons).toContain('Not enough remaining weight to reach passing grade');
  });

  it('maps probability to correct bucket', () => {
    const result = service.calculate({
      weightedPercent: 90,
      remainingWeight: 10,
      maxAchievablePercent: 100,
      totalAbsences: 0,
      missingWeeksCount: 0,
      examCompletedRatio: 1,
      quizTrend: 0.4,
      allComponentsCompleted: false,
      mlProbability: 0.2,
    });

    expect(result.bucket).toBe('green');
  });
});
