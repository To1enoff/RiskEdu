import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MlModule } from '../ml/ml.module';
import { AiSuggestion } from './entities/ai-suggestion.entity';
import { CourseWeek } from './entities/course-week.entity';
import { CourseWeight } from './entities/course-weight.entity';
import { Course } from './entities/course.entity';
import { ExamSubmission } from './entities/exam-submission.entity';
import { RiskPrediction } from './entities/risk-prediction.entity';
import { WeekSubmission } from './entities/week-submission.entity';
import { RiskEngineService } from './risk-engine/risk-engine.service';
import { AiSuggestionsService } from './suggestions/ai-suggestions.service';
import { CoursesController } from './courses.controller';
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
    ]),
    MlModule,
  ],
  controllers: [CoursesController],
  providers: [CoursesService, RiskEngineService, AiSuggestionsService],
  exports: [CoursesService, RiskEngineService, AiSuggestionsService],
})
export class CoursesModule {}
