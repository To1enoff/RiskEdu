import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from './user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ADVISOR,
  })
  role!: UserRole;

  @Column({ nullable: true })
  fullName?: string;

  @Column({ nullable: true })
  studentProfileId?: string;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ nullable: true })
  emailVerificationCode?: string;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerificationExpiresAt?: Date;

  @Column({ nullable: true })
  passwordResetCode?: string;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetExpiresAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
