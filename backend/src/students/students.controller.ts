import { Controller, ForbiddenException, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../users/user-role.enum';
import { QueryStudentsDto } from './dto/query-students.dto';
import { StudentsService } from './students.service';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ADVISOR, UserRole.INSTRUCTOR)
  findAll(@Query() query: QueryStudentsDto) {
    return this.studentsService.findAll(query);
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  async me(@Req() request: { user: JwtPayload }) {
    const studentProfileId = request.user.studentProfileId;
    if (!studentProfileId) {
      throw new ForbiddenException('Student profile is not linked to this account');
    }
    return this.studentsService.findOne(studentProfileId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ADVISOR, UserRole.INSTRUCTOR, UserRole.STUDENT)
  async findOne(@Param('id') id: string, @Req() request: { user: JwtPayload }) {
    if (request.user.role === UserRole.STUDENT && request.user.studentProfileId !== id) {
      throw new ForbiddenException('Students can only access their own profile');
    }
    return this.studentsService.findOne(id);
  }
}
