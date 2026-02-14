import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface MlExplanation {
  [key: string]: unknown;
  featureKey: string;
  displayName: string;
  contribution: number;
  direction: 'increase_risk' | 'decrease_risk';
  value?: string | number | null;
}

export interface MlPredictResponse {
  probability: number;
  label: number;
  bucket: 'green' | 'yellow' | 'red';
  explanations: MlExplanation[];
}

export interface MlWhatIfResponse {
  baselineProbability: number;
  newProbability: number;
  delta: number;
  bucket: 'green' | 'yellow' | 'red';
  changedFeatures: Array<Record<string, unknown>>;
  explanations: MlExplanation[];
}

export interface MlCourseRiskFeatures {
  weightedPercent: number;
  remainingWeight: number;
  maxAchievablePercent: number;
  totalAbsences: number;
  absencesRate: number;
  missingWeeksCount: number;
  examCompletedRatio: number;
  quizTrend: number;
}

export interface MlCourseRiskResponse {
  probabilityFail: number;
}

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

  async predict(features: Record<string, unknown>): Promise<MlPredictResponse> {
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
  ): Promise<MlWhatIfResponse> {
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

  async predictCourseRisk(features: MlCourseRiskFeatures): Promise<MlCourseRiskResponse> {
    try {
      const { data } = await this.client.post('/predict-risk', { features });
      return data;
    } catch (error) {
      throw new BadGatewayException('ML course risk request failed');
    }
  }
}
