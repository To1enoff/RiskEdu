import { Injectable } from '@nestjs/common';
import { getRiskBucket } from '../../common/utils/risk';
import { CourseRiskCalculationInput, CourseRiskFeatures, CourseRiskResult } from './risk-engine.types';

@Injectable()
export class RiskEngineService {
  calculate(input: CourseRiskCalculationInput): CourseRiskResult {
    const totalAbsences = Math.max(0, input.totalAbsences);
    const absencesRate = clamp(totalAbsences / 30, 0, 1);
    const weightedPercent = clamp(input.weightedPercent, 0, 100);
    const remainingWeight = clamp(input.remainingWeight, 0, 100);
    const maxAchievablePercent = clamp(input.maxAchievablePercent, 0, 100);
    const missingWeeksCount = clamp(input.missingWeeksCount, 0, 15);
    const examCompletedRatio = clamp(input.examCompletedRatio, 0, 1);
    const quizTrend = clamp(input.quizTrend, -1, 1);

    const reasons: string[] = [];
    let isAutoFail = false;
    let probabilityFail = 0;

    if (totalAbsences > 30) {
      isAutoFail = true;
      probabilityFail = 1;
      reasons.push('Absences exceed 30');
    }

    if (!isAutoFail && maxAchievablePercent < 50) {
      isAutoFail = true;
      probabilityFail = 1;
      reasons.push('Not enough remaining weight to reach passing grade');
    }

    if (!isAutoFail && input.allComponentsCompleted && weightedPercent < 50) {
      isAutoFail = true;
      probabilityFail = 1;
      reasons.push('Total weighted grade is below passing threshold (50%)');
    }

    if (!isAutoFail) {
      // Heuristic fallback risk model used when ML is missing or as blending component.
      const heuristic = clamp(
        0.45 * (1 - weightedPercent / 100) +
          0.2 * (missingWeeksCount / 15) +
          0.2 * absencesRate +
          0.15 * (1 - maxAchievablePercent / 100) +
          0.05 * Math.max(0, -quizTrend),
        0,
        1,
      );

      if (input.mlProbability !== undefined) {
        probabilityFail = clamp(0.7 * input.mlProbability + 0.3 * heuristic, 0, 1);
      } else {
        probabilityFail = heuristic;
      }
    }

    if (weightedPercent < 50) {
      reasons.push('Weighted score currently below 50%');
    }
    if (examCompletedRatio < 1) {
      reasons.push('Midterm or final exam not fully completed');
    }
    if (missingWeeksCount > 0) {
      reasons.push('Missing weekly submissions detected');
    }
    if (totalAbsences >= 25) {
      reasons.push('Absence level is critical (25+)');
    } else if (totalAbsences >= 20) {
      reasons.push('Absence level is in warning zone (20+)');
    }
    if (quizTrend < -0.2) {
      reasons.push('Weekly quiz trend is declining');
    }

    const features: CourseRiskFeatures = {
      weightedPercent,
      remainingWeight,
      maxAchievablePercent,
      totalAbsences,
      absencesRate,
      missingWeeksCount,
      examCompletedRatio,
      quizTrend,
    };

    return {
      probabilityFail,
      bucket: getRiskBucket(probabilityFail),
      isAutoFail,
      reasons: unique(reasons),
      features,
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
