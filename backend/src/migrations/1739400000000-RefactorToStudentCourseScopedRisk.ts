import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorToStudentCourseScopedRisk1739400000000 implements MigrationInterface {
  name = 'RefactorToStudentCourseScopedRisk1739400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS "studentId" varchar;
      UPDATE courses SET "studentId" = "ownerUserId"
      WHERE "studentId" IS NULL AND "ownerUserId" IS NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE risk_predictions ADD COLUMN IF NOT EXISTS "studentId" varchar;
      UPDATE risk_predictions SET "studentId" = "userId"
      WHERE "studentId" IS NULL AND "userId" IS NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE ai_suggestions ADD COLUMN IF NOT EXISTS "studentId" varchar;
      UPDATE ai_suggestions SET "studentId" = "userId"
      WHERE "studentId" IS NULL AND "userId" IS NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE exam_submissions ADD COLUMN IF NOT EXISTS "studentId" varchar;
      UPDATE exam_submissions SET "studentId" = "userId"
      WHERE "studentId" IS NULL AND "userId" IS NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE week_submissions ADD COLUMN IF NOT EXISTS "studentId" varchar;
      UPDATE week_submissions SET "studentId" = "userId"
      WHERE "studentId" IS NULL AND "userId" IS NOT NULL;
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
  }
}
