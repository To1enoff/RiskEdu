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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CoursesService, RequestUser } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { ExamSubmissionDto } from './dto/exam-submission.dto';
import { ManualSyllabusDto } from './dto/manual-syllabus.dto';
import { WeekSubmissionDto } from './dto/week-submission.dto';

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  listCourses(@Req() request: { user: JwtPayload }) {
    return this.coursesService.listCourses(toRequestUser(request.user));
  }

  @Post()
  createCourse(@Req() request: { user: JwtPayload }, @Body() payload: CreateCourseDto) {
    return this.coursesService.createCourse(toRequestUser(request.user), payload);
  }

  @Post(':id/syllabus/manual')
  setManualSyllabus(
    @Req() request: { user: JwtPayload },
    @Param('id') courseId: string,
    @Body() payload: ManualSyllabusDto,
  ) {
    return this.coursesService.setManualSyllabus(toRequestUser(request.user), courseId, payload);
  }

  @Post(':id/syllabus/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  uploadSyllabus(
    @Req() request: { user: JwtPayload },
    @Param('id') courseId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.coursesService.uploadSyllabus(toRequestUser(request.user), courseId, file);
  }

  @Get(':id/weights')
  getWeights(@Req() request: { user: JwtPayload }, @Param('id') courseId: string) {
    return this.coursesService.getWeights(toRequestUser(request.user), courseId);
  }

  @Post(':id/exams')
  submitExam(
    @Req() request: { user: JwtPayload },
    @Param('id') courseId: string,
    @Body() payload: ExamSubmissionDto,
  ) {
    return this.coursesService.submitExam(toRequestUser(request.user), courseId, payload);
  }

  @Get(':id/exams')
  getExams(@Req() request: { user: JwtPayload }, @Param('id') courseId: string) {
    return this.coursesService.getExams(toRequestUser(request.user), courseId);
  }

  @Post(':id/weeks/:weekNumber/submission')
  submitWeek(
    @Req() request: { user: JwtPayload },
    @Param('id') courseId: string,
    @Param('weekNumber', ParseIntPipe) weekNumber: number,
    @Body() payload: WeekSubmissionDto,
  ) {
    return this.coursesService.submitWeek(toRequestUser(request.user), courseId, weekNumber, payload);
  }

  @Get(':id/weeks')
  getWeeks(@Req() request: { user: JwtPayload }, @Param('id') courseId: string) {
    return this.coursesService.getWeeks(toRequestUser(request.user), courseId);
  }

  @Get(':id/risk')
  getRisk(@Req() request: { user: JwtPayload }, @Param('id') courseId: string) {
    return this.coursesService.getRisk(toRequestUser(request.user), courseId);
  }

  @Post(':id/predict')
  predict(@Req() request: { user: JwtPayload }, @Param('id') courseId: string) {
    return this.coursesService.predict(toRequestUser(request.user), courseId);
  }

  @Get(':id/suggestions')
  getSuggestions(@Req() request: { user: JwtPayload }, @Param('id') courseId: string) {
    return this.coursesService.getSuggestions(toRequestUser(request.user), courseId);
  }
}

function toRequestUser(payload: JwtPayload): RequestUser {
  return {
    sub: payload.sub,
    role: payload.role,
  };
}
