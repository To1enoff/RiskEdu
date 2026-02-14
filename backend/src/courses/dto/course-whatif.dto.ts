import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CourseWhatIfOverridesDto {
  @ApiPropertyOptional({ example: 65 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  midtermScore?: number;

  @ApiPropertyOptional({ example: 75 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  finalScore?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  quizzesAverage?: number;

  @ApiPropertyOptional({ example: 78 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  assignmentsAverage?: number;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalAbsences?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(15)
  missingWeeksCount?: number;
}

export class CourseWhatIfDto {
  @ApiProperty({ type: CourseWhatIfOverridesDto })
  @IsObject()
  @ValidateNested()
  @Type(() => CourseWhatIfOverridesDto)
  overrides!: CourseWhatIfOverridesDto;

  @ApiPropertyOptional({
    example: false,
    description: 'When true, persists simulation in what_if_simulations table.',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  save?: boolean;
}
