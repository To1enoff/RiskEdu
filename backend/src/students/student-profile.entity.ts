import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RiskBucket } from '../common/enums/risk-bucket.enum';
import { Prediction } from '../predictions/prediction.entity';

@Entity('student_profiles')
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  externalStudentId?: string;

  @Column({ nullable: true })
  fullName?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ type: 'jsonb', default: {} })
  features!: Record<string, unknown>;

  @Column({ type: 'float', nullable: true })
  latestProbability?: number;

  @Column({
    type: 'enum',
    enum: RiskBucket,
    nullable: true,
  })
  latestBucket?: RiskBucket;

  @Column({ type: 'int', nullable: true })
  latestLabel?: number;

  @Column({ type: 'jsonb', nullable: true })
  latestExplanations?: Array<Record<string, unknown>>;

  @Column({ type: 'timestamptz', nullable: true })
  lastPredictionAt?: Date;

  @OneToMany(() => Prediction, (prediction) => prediction.studentProfile)
  predictions?: Prediction[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
