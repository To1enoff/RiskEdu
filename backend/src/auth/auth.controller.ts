import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { sanitizeInput } from '../common/utils/sanitize';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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
}
