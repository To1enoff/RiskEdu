import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../users/user-role.enum';
import { AdminStudentsQueryDto } from '../dto/admin-students-query.dto';
import { CoursesService } from '../courses.service';

@ApiTags('admin-students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/students')
export class AdminStudentsController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  listStudents(@Query() query: AdminStudentsQueryDto) {
    return this.coursesService.adminListStudents(query);
  }

  @Get(':studentId')
  getStudent(@Param('studentId') studentId: string) {
    return this.coursesService.adminGetStudent(studentId);
  }

  @Get(':studentId/courses')
  getStudentCourses(@Param('studentId') studentId: string) {
    return this.coursesService.adminGetStudentCourses(studentId);
  }

  @Get(':studentId/courses/:courseId/risk')
  getStudentCourseRisk(@Param('studentId') studentId: string, @Param('courseId') courseId: string) {
    return this.coursesService.adminGetStudentCourseRisk(studentId, courseId);
  }
}
