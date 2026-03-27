import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Math 101' })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty({ required: false, example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  semesterStartDate?: string;
}
