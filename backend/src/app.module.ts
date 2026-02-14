import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { AiSuggestion } from './courses/entities/ai-suggestion.entity';
import { CourseWeek } from './courses/entities/course-week.entity';
import { CourseWeight } from './courses/entities/course-weight.entity';
import { Course } from './courses/entities/course.entity';
import { ExamSubmission } from './courses/entities/exam-submission.entity';
import { RiskPrediction } from './courses/entities/risk-prediction.entity';
import { WeekSubmission } from './courses/entities/week-submission.entity';
import { MlModule } from './ml/ml.module';
import { Prediction } from './predictions/prediction.entity';
import { PredictionsModule } from './predictions/predictions.module';
import { StudentProfile } from './students/student-profile.entity';
import { StudentsModule } from './students/students.module';
import { User } from './users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [
          User,
          StudentProfile,
          Prediction,
          Course,
          CourseWeight,
          CourseWeek,
          WeekSubmission,
          ExamSubmission,
          RiskPrediction,
          AiSuggestion,
        ],
        synchronize: true,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: false,
        logging: false,
      }),
    }),
    MlModule,
    AuthModule,
    StudentsModule,
    PredictionsModule,
    AnalyticsModule,
    CoursesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
