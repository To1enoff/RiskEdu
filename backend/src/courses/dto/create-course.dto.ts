import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Math 101' })
  @IsString()
  @MinLength(2)
  title!: string;
}
