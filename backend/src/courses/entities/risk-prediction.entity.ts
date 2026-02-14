import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RiskBucket } from '../../common/enums/risk-bucket.enum';
import { Course } from './course.entity';

@Entity('risk_predictions')
export class RiskPrediction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  courseId!: string;

  @ManyToOne(() => Course, (course) => course.riskPredictions, { onDelete: 'CASCADE' })
  course!: Course;

  @Column()
  userId!: string;

  @Column({ type: 'float' })
  probabilityFail!: number;

  @Column({ type: 'enum', enum: RiskBucket })
  bucket!: RiskBucket;

  @Column({ default: false })
  isAutoFail!: boolean;

  @Column({ type: 'jsonb', default: [] })
  reasonsJson!: string[];

  @Column({ type: 'jsonb', default: {} })
  detailsJson!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;
}
