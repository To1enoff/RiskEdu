import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, Max, Min } from 'class-validator';
import { ExamType } from '../enums/exam-type.enum';

export class ExamSubmissionDto {
  @ApiProperty({ enum: ExamType, example: ExamType.MIDTERM })
  @IsEnum(ExamType)
  type!: ExamType;

  @ApiProperty({ example: 72 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;
}
