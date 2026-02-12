import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class MlService {
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('ML_SERVICE_URL', 'http://localhost:8000');
    this.client = axios.create({
      baseURL,
      timeout: 10000,
    });
  }

  async predict(features: Record<string, unknown>) {
    try {
      const { data } = await this.client.post('/predict', { features });
      return data;
    } catch (error) {
      throw new BadGatewayException('ML predict request failed');
    }
  }

  async whatIf(
    baselineFeatures: Record<string, unknown>,
    overrides: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    try {
      const { data } = await this.client.post('/whatif', { baselineFeatures, overrides });
      return data;
    } catch (error) {
      throw new BadGatewayException('ML what-if request failed');
    }
  }

  async featureImportance(): Promise<Record<string, unknown>> {
    try {
      const { data } = await this.client.get('/feature-importance');
      return data;
    } catch (error) {
      throw new BadGatewayException('ML feature-importance request failed');
    }
  }

  async health(): Promise<Record<string, unknown>> {
    try {
      const { data } = await this.client.get('/health');
      return data;
    } catch {
      return { status: 'down' };
    }
  }
}
