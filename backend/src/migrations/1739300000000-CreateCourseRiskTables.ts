import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCourseRiskTables1739300000000 implements MigrationInterface {
  name = 'CreateCourseRiskTables1739300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "studentId" varchar NOT NULL,
        title varchar NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS course_weights (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "courseId" uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        "componentName" varchar NOT NULL,
        "weightPercent" double precision NOT NULL,
        CONSTRAINT uq_course_weight_component UNIQUE ("courseId", "componentName")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS course_weeks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "courseId" uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        "weekNumber" integer NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_course_week_number UNIQUE ("courseId", "weekNumber")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS week_submissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "courseWeekId" uuid NOT NULL REFERENCES course_weeks(id) ON DELETE CASCADE,
        "studentId" varchar NOT NULL,
        "quizScore" double precision NULL,
        "assignmentScore" double precision NULL,
        "absenceCountWeek" integer NOT NULL DEFAULT 0,
        "submittedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_week_submission_user UNIQUE ("courseWeekId", "studentId")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS exam_submissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "courseId" uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        "studentId" varchar NOT NULL,
        type varchar NOT NULL,
        score double precision NOT NULL,
        "submittedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_exam_submission_unique UNIQUE ("courseId", "studentId", type)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS risk_predictions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "courseId" uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        "studentId" varchar NOT NULL,
        "probabilityFail" double precision NOT NULL,
        bucket varchar NOT NULL,
        "isAutoFail" boolean NOT NULL DEFAULT false,
        "reasonsJson" jsonb NOT NULL DEFAULT '[]',
        "detailsJson" jsonb NOT NULL DEFAULT '{}',
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ai_suggestions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "courseId" uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        "studentId" varchar NOT NULL,
        "suggestionsJson" jsonb NOT NULL DEFAULT '[]',
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS what_if_simulations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "courseId" uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        "studentId" varchar NOT NULL,
        "baselineProbability" double precision NOT NULL,
        "newProbability" double precision NOT NULL,
        delta double precision NOT NULL,
        overrides jsonb NOT NULL DEFAULT '{}',
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS what_if_simulations;`);
    await queryRunner.query(`DROP TABLE IF EXISTS ai_suggestions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS risk_predictions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS exam_submissions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS week_submissions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS course_weeks;`);
    await queryRunner.query(`DROP TABLE IF EXISTS course_weights;`);
    await queryRunner.query(`DROP TABLE IF EXISTS courses;`);
  }
}
