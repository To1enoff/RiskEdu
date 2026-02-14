import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MlModule } from '../ml/ml.module';
import { User } from '../users/user.entity';
import { AiSuggestion } from './entities/ai-suggestion.entity';
import { CourseWeek } from './entities/course-week.entity';
import { CourseWeight } from './entities/course-weight.entity';
import { Course } from './entities/course.entity';
import { ExamSubmission } from './entities/exam-submission.entity';
import { RiskPrediction } from './entities/risk-prediction.entity';
import { WeekSubmission } from './entities/week-submission.entity';
import { WhatIfSimulation } from './entities/what-if-simulation.entity';
import { RiskEngineService } from './risk-engine/risk-engine.service';
import { AiSuggestionsService } from './suggestions/ai-suggestions.service';
import { AdminStudentsController } from './controllers/admin-students.controller';
import { StudentCoursesController } from './controllers/student-courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      CourseWeight,
      CourseWeek,
      WeekSubmission,
      ExamSubmission,
      RiskPrediction,
      AiSuggestion,
      WhatIfSimulation,
      User,
    ]),
    MlModule,
  ],
  controllers: [StudentCoursesController, AdminStudentsController],
  providers: [CoursesService, RiskEngineService, AiSuggestionsService],
  exports: [CoursesService, RiskEngineService, AiSuggestionsService],
})
export class CoursesModule {}
