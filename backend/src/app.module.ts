import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
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
        entities: [User, StudentProfile, Prediction],
        synchronize: true,
        logging: false,
      }),
    }),
    MlModule,
    AuthModule,
    StudentsModule,
    PredictionsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
