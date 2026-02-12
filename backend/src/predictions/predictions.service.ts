import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapRawFeaturesToInternal } from '../common/utils/feature-mapper';
import { sanitizeInput } from '../common/utils/sanitize';
import { MlService } from '../ml/ml.service';
import { StudentProfile } from '../students/student-profile.entity';
import { PredictDto } from './dto/predict.dto';
import { WhatIfDto } from './dto/whatif.dto';
import { Prediction, PredictionSource } from './prediction.entity';

@Injectable()
export class PredictionsService {
  constructor(
    @InjectRepository(Prediction)
    private readonly predictionsRepository: Repository<Prediction>,
    @InjectRepository(StudentProfile)
    private readonly profilesRepository: Repository<StudentProfile>,
    private readonly mlService: MlService,
  ) {}

  async predict(payload: PredictDto) {
    const sanitizedPayload = sanitizeInput(payload);
    const mappedFeatures = mapRawFeaturesToInternal(
      sanitizedPayload.features as unknown as Record<string, unknown>,
    );

    if (Object.keys(mappedFeatures).length === 0) {
      throw new BadRequestException('No valid features provided for prediction');
    }

    const mlResponse = await this.mlService.predict(mappedFeatures);
    const profile = await this.resolveProfileForPrediction(sanitizedPayload, mappedFeatures);

    const prediction = this.predictionsRepository.create({
      source: PredictionSource.PREDICT,
      studentProfile: profile,
      probability: Number(mlResponse.probability),
      label: Number(mlResponse.label),
      bucket: mlResponse.bucket,
      explanations: mlResponse.explanations ?? [],
      featureSnapshot: mappedFeatures,
    });
    await this.predictionsRepository.save(prediction);

    profile.latestProbability = Number(mlResponse.probability);
    profile.latestLabel = Number(mlResponse.label);
    profile.latestBucket = mlResponse.bucket;
    profile.latestExplanations = mlResponse.explanations ?? [];
    profile.lastPredictionAt = new Date();
    profile.features = mappedFeatures;
    await this.profilesRepository.save(profile);

    return {
      studentId: profile.id,
      ...mlResponse,
    };
  }

  async whatIf(payload: WhatIfDto) {
    const sanitizedPayload = sanitizeInput(payload);

    let baselineFeatures = mapRawFeaturesToInternal(
      sanitizedPayload.baselineFeatures as unknown as Record<string, unknown>,
    );
    const overrides = mapRawFeaturesToInternal(
      (sanitizedPayload.overrides as unknown as Record<string, unknown>) ?? {},
    );

    let profile: StudentProfile | null = null;
    if (sanitizedPayload.studentId) {
      profile = await this.profilesRepository.findOne({ where: { id: sanitizedPayload.studentId } });
      if (!profile) {
        throw new NotFoundException(`Student ${sanitizedPayload.studentId} not found`);
      }
      if (Object.keys(baselineFeatures).length === 0) {
        baselineFeatures = mapRawFeaturesToInternal(profile.features ?? {});
      }
    }

    if (Object.keys(baselineFeatures).length === 0) {
      throw new BadRequestException('No baseline features provided for what-if simulation');
    }

    // What-if overrides are partial by design: only changed fields are sent.
    const mlResponse = await this.mlService.whatIf(baselineFeatures, overrides);

    const snapshotAfterOverrides = {
      ...baselineFeatures,
      ...overrides,
    };

    const prediction = this.predictionsRepository.create({
      source: PredictionSource.WHATIF,
      studentProfile: profile,
      probability: Number(mlResponse.newProbability),
      baselineProbability: Number(mlResponse.baselineProbability),
      delta: Number(mlResponse.delta),
      label: mlResponse.newProbability >= 0.5 ? 1 : 0,
      bucket: mlResponse.bucket,
      explanations: mlResponse.explanations ?? [],
      changedFeatures: mlResponse.changedFeatures ?? [],
      featureSnapshot: snapshotAfterOverrides,
    });
    await this.predictionsRepository.save(prediction);

    return mlResponse;
  }

  private async resolveProfileForPrediction(
    payload: PredictDto,
    mappedFeatures: Record<string, unknown>,
  ): Promise<StudentProfile> {
    if (payload.studentId) {
      const existing = await this.profilesRepository.findOne({ where: { id: payload.studentId } });
      if (!existing) {
        throw new NotFoundException(`Student ${payload.studentId} not found`);
      }
      existing.features = mappedFeatures;
      existing.fullName = payload.fullName ?? existing.fullName;
      existing.department = payload.department ?? existing.department;
      existing.externalStudentId = payload.externalStudentId ?? existing.externalStudentId;
      return this.profilesRepository.save(existing);
    }

    if (payload.externalStudentId) {
      const byExternalId = await this.profilesRepository.findOne({
        where: { externalStudentId: payload.externalStudentId },
      });
      if (byExternalId) {
        byExternalId.features = mappedFeatures;
        byExternalId.fullName = payload.fullName ?? byExternalId.fullName;
        byExternalId.department = payload.department ?? byExternalId.department;
        return this.profilesRepository.save(byExternalId);
      }
    }

    const created = this.profilesRepository.create({
      externalStudentId: payload.externalStudentId,
      fullName: payload.fullName,
      department: payload.department,
      features: mappedFeatures,
    });
    return this.profilesRepository.save(created);
  }
}
