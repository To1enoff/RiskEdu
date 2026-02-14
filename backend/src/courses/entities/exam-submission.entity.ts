import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ExamType } from '../enums/exam-type.enum';
import { Course } from './course.entity';

@Entity('exam_submissions')
@Unique('uq_exam_submission_unique', ['courseId', 'studentId', 'type'])
export class ExamSubmission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  courseId!: string;

  @ManyToOne(() => Course, (course) => course.examSubmissions, { onDelete: 'CASCADE' })
  course!: Course;

  @Column()
  studentId!: string;

  @Column({
    type: 'enum',
    enum: ExamType,
  })
  type!: ExamType;

  @Column({ type: 'float' })
  score!: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt!: Date;
}
