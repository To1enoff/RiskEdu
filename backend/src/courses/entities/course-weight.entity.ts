import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { CourseComponent } from '../enums/course-component.enum';
import { Course } from './course.entity';

@Entity('course_weights')
@Unique('uq_course_weight_component', ['courseId', 'componentName'])
export class CourseWeight {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  courseId!: string;

  @ManyToOne(() => Course, (course) => course.weights, { onDelete: 'CASCADE' })
  course!: Course;

  @Column({
    type: 'enum',
    enum: CourseComponent,
  })
  componentName!: CourseComponent;

  @Column({ type: 'float' })
  weightPercent!: number;
}
