import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { StudentFeaturesDto } from '../../common/dto/student-features.dto';

export class WhatIfDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiProperty({ type: StudentFeaturesDto })
  @ValidateNested()
  @Type(() => StudentFeaturesDto)
  baselineFeatures!: StudentFeaturesDto;

  @ApiProperty({ type: StudentFeaturesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StudentFeaturesDto)
  overrides: Partial<StudentFeaturesDto> = {};
}
