import { CourseComponent } from '../enums/course-component.enum';

export interface WeightedInput {
  weights: Record<CourseComponent, number>;
  midtermScore: number;
  finalScore: number;
  quizzesAverage: number;
  assignmentsAverage: number;
  projectsScore?: number;
}

export function calculateWeightedPercent(input: WeightedInput): number {
  return clamp(
    (input.midtermScore * (input.weights.midterm ?? 0)) / 100 +
      (input.finalScore * (input.weights.final ?? 0)) / 100 +
      (input.quizzesAverage * (input.weights.quizzes ?? 0)) / 100 +
      (input.assignmentsAverage * (input.weights.assignments ?? 0)) / 100 +
      ((input.projectsScore ?? 0) * (input.weights.projects ?? 0)) / 100,
    0,
    100,
  );
}

export function calculateMaxAchievablePercent(weightedPercent: number, remainingWeight: number): number {
  return clamp(weightedPercent + remainingWeight, 0, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
