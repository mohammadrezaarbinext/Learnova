import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/entity/base.entity';

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

const courseLevelMap: Record<string, CourseLevel | undefined> = {
  [CourseLevel.BEGINNER]: CourseLevel.BEGINNER,
  [CourseLevel.INTERMEDIATE]: CourseLevel.INTERMEDIATE,
  [CourseLevel.ADVANCED]: CourseLevel.ADVANCED,
};

const courseStatusMap: Record<string, CourseStatus | undefined> = {
  [CourseStatus.DRAFT]: CourseStatus.DRAFT,
  [CourseStatus.PUBLISHED]: CourseStatus.PUBLISHED,
  [CourseStatus.ARCHIVED]: CourseStatus.ARCHIVED,
};

export type CourseTeacherEntity = {
  id: number;
  uuid: string;
  fullName: string;
  phone: string;
  email: string | null;
};

@Entity('Course')
export class CourseEntity extends BaseEntity {
  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ nullable: true, length: 500 })
  thumbnailUrl!: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  price!: string;

  @Column({
    type: 'enum',
    enum: CourseLevel,
  })
  level!: CourseLevel;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.DRAFT,
  })
  status!: CourseStatus;

  @Index()
  @Column({ type: 'int' })
  teacherId!: number;

  teacher?: CourseTeacherEntity;
}

export type CourseListEntity = CourseEntity;
export type CourseLevelValue = CourseLevel;
export type CourseStatusValue = CourseStatus;

export type DeleteCourseEntity = {
  id: number;
  uuid: string;
  deleted: true;
};

type DecimalLike = { toString(): string };

type CoursePersistence = Omit<CourseEntity, 'price' | 'level' | 'status'> & {
  price: DecimalLike | string | number;
  level: string;
  status: string;
};

export function canManageCourse(user: { id: number; roles: string[] }, teacherId: number): boolean {
  return user.roles.includes('ADMIN') || (user.roles.includes('TEACHER') && user.id === teacherId);
}

export function toCourseLevel(value: string): CourseLevel {
  const level = courseLevelMap[value];
  if (!level) {
    throw new Error(`Unsupported course level: ${value}`);
  }

  return level;
}

export function toCourseStatus(value: string): CourseStatus {
  const status = courseStatusMap[value];
  if (!status) {
    throw new Error(`Unsupported course status: ${value}`);
  }

  return status;
}

export function toCourseEntity(course: CoursePersistence): CourseEntity {
  return {
    ...course,
    price: course.price?.toString?.() ?? String(course.price),
    level: toCourseLevel(course.level),
    status: toCourseStatus(course.status),
  };
}
