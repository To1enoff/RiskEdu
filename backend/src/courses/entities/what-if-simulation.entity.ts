import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Course } from './course.entity';

@Entity('what_if_simulations')
export class WhatIfSimulation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  courseId!: string;

  @ManyToOne(() => Course, (course) => course.whatIfSimulations, { onDelete: 'CASCADE' })
  course!: Course;

  @Column()
  studentId!: string;

  @Column({ type: 'float' })
  baselineProbability!: number;

  @Column({ type: 'float' })
  newProbability!: number;

  @Column({ type: 'float' })
  delta!: number;

  @Column({ type: 'jsonb', default: {} })
  overrides!: Record<string, number>;

  @CreateDateColumn()
  createdAt!: Date;
}
