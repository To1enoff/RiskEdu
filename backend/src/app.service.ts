import { Injectable } from '@nestjs/common';
import { MlService } from './ml/ml.service';

@Injectable()
export class AppService {
  constructor(private readonly mlService: MlService) {}

  async getHealth() {
    const mlStatus = await this.mlService.health();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      mlService: mlStatus,
    };
  }
}
