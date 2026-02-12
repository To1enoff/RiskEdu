import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RiskBucket } from '../common/enums/risk-bucket.enum';
import { StudentProfile } from '../students/student-profile.entity';

export enum PredictionSource {
  PREDICT = 'predict',
  WHATIF = 'whatif',
}

@Entity('predictions')
export class Prediction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => StudentProfile, (profile) => profile.predictions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  studentProfile?: StudentProfile | null;

  @Column({
    type: 'enum',
    enum: PredictionSource,
    default: PredictionSource.PREDICT,
  })
  source!: PredictionSource;

  @Column({ type: 'float' })
  probability!: number;

  @Column({ type: 'int' })
  label!: number;

  @Column({
    type: 'enum',
    enum: RiskBucket,
  })
  bucket!: RiskBucket;

  @Column({ type: 'float', nullable: true })
  baselineProbability?: number;

  @Column({ type: 'float', nullable: true })
  delta?: number;

  @Column({ type: 'jsonb' })
  explanations!: Array<Record<string, unknown>>;

  @Column({ type: 'jsonb', nullable: true })
  changedFeatures?: Array<Record<string, unknown>>;

  @Column({ type: 'jsonb' })
  featureSnapshot!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;
}
