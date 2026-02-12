import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export class StudentFeaturesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  logins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  totalHoursInModuleArea?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  percentOfAverageHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  presence?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  absence?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  percentAttended?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attendingFromHome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  distanceToUniversityKm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  polar4Quintile?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  polar3Quintile?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  adultHe2001Quintile?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  adultHe2011Quintile?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  tundraMsoaQuintile?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  tundraLsoaQuintile?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  gapsGcseQuintile?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value))
  @IsNumber()
  gapsGcseEthnicityQuintile?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uniConnectTargetWard?: string;
}
