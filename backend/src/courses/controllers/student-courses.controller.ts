import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { UserRole } from '../../users/user-role.enum';
import { CourseWhatIfDto } from '../dto/course-whatif.dto';
import { CreateCourseDto } from '../dto/create-course.dto';
import { ExamSubmissionDto } from '../dto/exam-submission.dto';
import { ManualSyllabusDto } from '../dto/manual-syllabus.dto';
import { WeekSubmissionDto } from '../dto/week-submission.dto';
import { CoursesService, RequestUser } from '../courses.service';

@ApiTags('student-courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@Controller('student/courses')
export class StudentCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  listCourses(@Req() request: { user: JwtPayload }) {
    return this.coursesService.listStudentCourses(toRequestUser(request.user));
  }

  @Post()
  createCourse(@Req() request: { user: JwtPayload }, @Body() payload: CreateCourseDto) {
    return this.coursesService.createStudentCourse(toRequestUser(request.user), payload);
  }

  @Get(':courseId')
  getCourse(@Req() request: { user: JwtPayload }, @Param('courseId') courseId: string) {
    return this.coursesService.getStudentCourse(toRequestUser(request.user), courseId);
  }

  @Post(':courseId/syllabus/manual')
  setManualSyllabus(
    @Req() request: { user: JwtPayload },
    @Param('courseId') courseId: string,
    @Body() payload: ManualSyllabusDto,
  ) {
    return this.coursesService.setManualSyllabus(toRequestUser(request.user), courseId, payload);
  }

  @Post(':courseId/syllabus/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  uploadSyllabus(
    @Req() request: { user: JwtPayload },
    @Param('courseId') courseId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.coursesService.uploadSyllabus(toRequestUser(request.user), courseId, file);
  }

  @Get(':courseId/weights')
  getWeights(@Req() request: { user: JwtPayload }, @Param('courseId') courseId: string) {
    return this.coursesService.getWeights(toRequestUser(request.user), courseId);
  }

  @Post(':courseId/exams')
  submitExam(
    @Req() request: { user: JwtPayload },
    @Param('courseId') courseId: string,
    @Body() payload: ExamSubmissionDto,
  ) {
    return this.coursesService.submitExam(toRequestUser(request.user), courseId, payload);
  }

  @Get(':courseId/exams')
  getExams(@Req() request: { user: JwtPayload }, @Param('courseId') courseId: string) {
    return this.coursesService.getExams(toRequestUser(request.user), courseId);
  }

  @Post(':courseId/weeks/:weekNumber/submission')
  submitWeek(
    @Req() request: { user: JwtPayload },
    @Param('courseId') courseId: string,
    @Param('weekNumber', ParseIntPipe) weekNumber: number,
    @Body() payload: WeekSubmissionDto,
  ) {
    return this.coursesService.submitWeek(toRequestUser(request.user), courseId, weekNumber, payload);
  }

  @Get(':courseId/weeks')
  getWeeks(@Req() request: { user: JwtPayload }, @Param('courseId') courseId: string) {
    return this.coursesService.getWeeks(toRequestUser(request.user), courseId);
  }

  @Get(':courseId/risk')
  getRisk(@Req() request: { user: JwtPayload }, @Param('courseId') courseId: string) {
    return this.coursesService.getStudentCourseRisk(toRequestUser(request.user), courseId);
  }

  @Post(':courseId/predict')
  predict(@Req() request: { user: JwtPayload }, @Param('courseId') courseId: string) {
    return this.coursesService.predictStudentCourse(toRequestUser(request.user), courseId);
  }

  @Post(':courseId/what-if')
  whatIf(
    @Req() request: { user: JwtPayload },
    @Param('courseId') courseId: string,
    @Body() payload: CourseWhatIfDto,
  ) {
    return this.coursesService.runCourseWhatIf(toRequestUser(request.user), courseId, payload);
  }

  @Get(':courseId/suggestions')
  getSuggestions(@Req() request: { user: JwtPayload }, @Param('courseId') courseId: string) {
    return this.coursesService.getStudentSuggestions(toRequestUser(request.user), courseId);
  }
}

function toRequestUser(payload: JwtPayload): RequestUser {
  return { sub: payload.sub, role: payload.role };
}
