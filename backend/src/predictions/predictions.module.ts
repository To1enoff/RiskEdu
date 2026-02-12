import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MlModule } from '../ml/ml.module';
import { StudentProfile } from '../students/student-profile.entity';
import { Prediction } from './prediction.entity';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Prediction, StudentProfile]), MlModule],
  controllers: [PredictionsController],
  providers: [PredictionsService],
})
export class PredictionsModule {}
