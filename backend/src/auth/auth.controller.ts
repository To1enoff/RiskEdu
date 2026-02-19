import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { sanitizeInput } from '../common/utils/sanitize';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() payload: RegisterDto) {
    return this.authService.register(sanitizeInput(payload));
  }

  @Post('login')
  login(@Body() payload: LoginDto) {
    return this.authService.login(sanitizeInput(payload));
  }

  @Post('verify-email')
  verifyEmail(@Body() payload: VerifyEmailDto) {
    return this.authService.verifyEmail(sanitizeInput(payload));
  }

  @Post('forgot-password')
  forgotPassword(@Body() payload: ForgotPasswordDto) {
    return this.authService.forgotPassword(sanitizeInput(payload));
  }

  @Post('reset-password')
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword(sanitizeInput(payload));
  }
}
