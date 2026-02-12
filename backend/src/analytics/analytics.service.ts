import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toDisplayName } from '../common/utils/feature-mapper';
import { MlService } from '../ml/ml.service';
import { StudentProfile } from '../students/student-profile.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(StudentProfile)
    private readonly profilesRepository: Repository<StudentProfile>,
    private readonly mlService: MlService,
  ) {}

  async getFeatureImportance(department?: string) {
    const query = this.profilesRepository
      .createQueryBuilder('profile')
      .where('profile.latestExplanations IS NOT NULL');

    if (department) {
      query.andWhere('profile.department = :department', { department });
    }

    const profiles = await query.getMany();
    if (profiles.length === 0) {
      const mlImportance = await this.mlService.featureImportance();
      return {
        source: 'ml-global',
        department: department ?? null,
        ...mlImportance,
      };
    }

    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};

    for (const profile of profiles) {
      const explanations = (profile.latestExplanations ?? []) as Array<Record<string, unknown>>;
      for (const explanation of explanations) {
        const key =
          String(explanation.featureKey ?? explanation.feature ?? '').trim() || 'unknownFeature';
        const contribution = Math.abs(Number(explanation.contribution ?? 0));

        totals[key] = (totals[key] ?? 0) + contribution;
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }

    const features = Object.entries(totals)
      .map(([featureKey, total]) => ({
        featureKey,
        displayName: toDisplayName(featureKey),
        score: total / Math.max(1, counts[featureKey] ?? 1),
      }))
      .sort((a, b) => b.score - a.score);

    return {
      source: 'db-aggregated',
      department: department ?? null,
      features,
    };
  }
}
