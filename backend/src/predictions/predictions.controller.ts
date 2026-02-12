import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user-role.enum';
import { PredictDto } from './dto/predict.dto';
import { WhatIfDto } from './dto/whatif.dto';
import { PredictionsService } from './predictions.service';

@ApiTags('predictions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Post('predict')
  @Roles(UserRole.ADMIN, UserRole.ADVISOR, UserRole.INSTRUCTOR)
  predict(@Body() payload: PredictDto) {
    return this.predictionsService.predict(payload);
  }

  @Post('whatif')
  @Roles(UserRole.ADMIN, UserRole.ADVISOR, UserRole.INSTRUCTOR, UserRole.STUDENT)
  whatIf(@Body() payload: WhatIfDto) {
    return this.predictionsService.whatIf(payload);
  }
}
