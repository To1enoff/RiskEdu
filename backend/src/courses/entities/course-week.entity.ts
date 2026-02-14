import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Course } from './course.entity';
import { WeekSubmission } from './week-submission.entity';

@Entity('course_weeks')
@Unique('uq_course_week_number', ['courseId', 'weekNumber'])
export class CourseWeek {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  courseId!: string;

  @ManyToOne(() => Course, (course) => course.weeks, { onDelete: 'CASCADE' })
  course!: Course;

  @Column({ type: 'int' })
  weekNumber!: number;

  @OneToMany(() => WeekSubmission, (submission) => submission.courseWeek)
  submissions?: WeekSubmission[];

  @CreateDateColumn()
  createdAt!: Date;
}
