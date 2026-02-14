import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Course } from './course.entity';

@Entity('ai_suggestions')
export class AiSuggestion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  courseId!: string;

  @ManyToOne(() => Course, (course) => course.aiSuggestions, { onDelete: 'CASCADE' })
  course!: Course;

  @Column()
  userId!: string;

  @Column({ type: 'jsonb', default: [] })
  suggestionsJson!: Array<Record<string, unknown>>;

  @CreateDateColumn()
  createdAt!: Date;
}
