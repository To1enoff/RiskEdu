import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const STRICT_EMAIL_REGEX =
  /^(?=.{6,254}$)(?=.{1,64}@)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

export class RegisterDto {
  @ApiProperty({ example: 'student@example.edu' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @MaxLength(254)
  @IsEmail(
    {
      allow_display_name: false,
      allow_utf8_local_part: false,
      require_tld: true,
    },
    { message: 'Email format is invalid' },
  )
  @Matches(STRICT_EMAIL_REGEX, { message: 'Email must be a real address with a valid domain' })
  email!: string;

  @ApiProperty({ minLength: 8, example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: 'Jane Student' })
  @IsOptional()
  @IsString()
  fullName?: string;
}
