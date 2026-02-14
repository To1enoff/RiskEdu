import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { RiskBucket } from '../../common/enums/risk-bucket.enum';

export class AdminStudentsQueryDto {
  @ApiPropertyOptional({ enum: RiskBucket })
  @IsOptional()
  @IsEnum(RiskBucket)
  bucket?: RiskBucket;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  highRiskOnly?: boolean;

  @ApiPropertyOptional({ example: 'b8e2bd14-8b48-49cf-976c-c0882ff0cd4f' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum({ asc: 'asc', desc: 'desc' })
  sort: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 100, minimum: 1, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit = 100;
}
