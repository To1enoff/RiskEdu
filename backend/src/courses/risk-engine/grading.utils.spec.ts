import { describe, expect, it } from '@jest/globals';
import { CourseComponent } from '../enums/course-component.enum';
import { calculateWeightedPercent } from './grading.utils';

describe('calculateWeightedPercent', () => {
  it('computes weighted score correctly', () => {
    const weights: Record<CourseComponent, number> = {
      midterm: 30,
      final: 40,
      quizzes: 20,
      assignments: 10,
      projects: 0,
    };

    const result = calculateWeightedPercent({
      weights,
      midtermScore: 80,
      finalScore: 70,
      quizzesAverage: 90,
      assignmentsAverage: 100,
      projectsScore: 0,
    });

    // 80*0.3 + 70*0.4 + 90*0.2 + 100*0.1 = 80
    expect(result).toBeCloseTo(80, 5);
  });
});
