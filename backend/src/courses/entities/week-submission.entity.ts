import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { CourseWeek } from './course-week.entity';

@Entity('week_submissions')
@Unique('uq_week_submission_user', ['courseWeekId', 'studentId'])
export class WeekSubmission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  courseWeekId!: string;

  @ManyToOne(() => CourseWeek, (courseWeek) => courseWeek.submissions, { onDelete: 'CASCADE' })
  courseWeek!: CourseWeek;

  @Column()
  studentId!: string;

  @Column({ type: 'float', nullable: true })
  quizScore?: number | null;

  @Column({ type: 'float', nullable: true })
  assignmentScore?: number | null;

  @Column({ type: 'int', default: 0 })
  absenceCountWeek!: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt!: Date;
}
