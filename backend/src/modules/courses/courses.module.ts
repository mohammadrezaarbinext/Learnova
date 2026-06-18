import { Module } from '@nestjs/common';
import { CourseRepository } from './entity/course.repository';
import { CoursesService } from './service/courses.service';

@Module({
  providers: [CourseRepository, CoursesService],
  exports: [CoursesService, CourseRepository],
})
export class CoursesModule {}
