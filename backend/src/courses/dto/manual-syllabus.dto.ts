import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CourseWeightsDto {
  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  midterm?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  final?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quizzes?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  assignments?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  projects?: number;
}

export class ManualSyllabusDto {
  @ApiPropertyOptional({ example: 'Math 101' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ type: CourseWeightsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => CourseWeightsDto)
  weights!: CourseWeightsDto;
}
