import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AiSuggestion } from './ai-suggestion.entity';
import { CourseWeek } from './course-week.entity';
import { CourseWeight } from './course-weight.entity';
import { ExamSubmission } from './exam-submission.entity';
import { RiskPrediction } from './risk-prediction.entity';
import { WhatIfSimulation } from './what-if-simulation.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  studentId!: string;

  @Column()
  title!: string;

  @OneToMany(() => CourseWeight, (weight) => weight.course, { cascade: true })
  weights?: CourseWeight[];

  @OneToMany(() => CourseWeek, (week) => week.course, { cascade: true })
  weeks?: CourseWeek[];

  @OneToMany(() => ExamSubmission, (exam) => exam.course)
  examSubmissions?: ExamSubmission[];

  @OneToMany(() => RiskPrediction, (prediction) => prediction.course)
  riskPredictions?: RiskPrediction[];

  @OneToMany(() => AiSuggestion, (suggestion) => suggestion.course)
  aiSuggestions?: AiSuggestion[];

  @OneToMany(() => WhatIfSimulation, (simulation) => simulation.course)
  whatIfSimulations?: WhatIfSimulation[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
