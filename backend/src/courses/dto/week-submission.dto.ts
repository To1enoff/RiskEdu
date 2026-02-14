import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class WeekSubmissionDto {
  @ApiPropertyOptional({ example: 78 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  quizScore?: number;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  assignmentScore?: number;

  @ApiPropertyOptional({ example: 2, default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  absenceCountWeek = 0;
}
