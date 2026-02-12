import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MlService } from './ml.service';

@Module({
  imports: [ConfigModule],
  providers: [MlService],
  exports: [MlService],
})
export class MlModule {}
