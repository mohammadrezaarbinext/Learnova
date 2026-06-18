import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/entity/base.entity';
import { CourseLevel, CourseStatus, toCourseLevel, toCourseStatus } from '../../courses/entity/course.entity';

export type EnrollmentCourseEntity = {
  id: number;
  uuid: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  price: string;
  level: CourseLevel;
  status: CourseStatus;
  teacherId: number;
  createdAt: Date;
  updatedAt: Date;
};

@Entity('Enrollment')
@Index(['studentId', 'courseId'], { unique: true })
export class EnrollmentEntity extends BaseEntity {
  @Index()
  @Column({ type: 'int' })
  studentId!: number;

  @Index()
  @Column({ type: 'int' })
  courseId!: number;

  course?: EnrollmentCourseEntity;
}

export type DeleteEnrollmentEntity = {
  id: number;
  uuid: string;
  deleted: true;
};

type DecimalLike = { toString(): string };

type EnrollmentPersistence = Omit<EnrollmentEntity, 'course'> & {
  course?: (Omit<EnrollmentCourseEntity, 'price' | 'level' | 'status'> & {
    price: DecimalLike | string | number;
    level: string;
    status: string;
  }) | null;
};

export function serializeEnrollment(enrollment: EnrollmentPersistence): EnrollmentEntity {
  return {
    id: enrollment.id,
    uuid: enrollment.uuid,
    studentId: enrollment.studentId,
    courseId: enrollment.courseId,
    course: enrollment.course
      ? {
          ...enrollment.course,
          price: enrollment.course.price?.toString?.() ?? String(enrollment.course.price),
          level: toCourseLevel(enrollment.course.level),
          status: toCourseStatus(enrollment.course.status),
        }
      : undefined,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
  };
}
