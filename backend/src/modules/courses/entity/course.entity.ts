import { CourseLevel, CourseStatus, Prisma } from '@prisma/client';

export const courseDetailInclude = Prisma.validator<Prisma.CourseInclude>()({
  teacher: {
    select: {
      id: true,
      uuid: true,
      fullName: true,
      phone: true,
      email: true,
    },
  },
});

export const courseWithTeacherInclude = Prisma.validator<Prisma.CourseInclude>()({
  teacher: {
    select: {
      id: true,
      uuid: true,
      fullName: true,
      phone: true,
      email: true,
    },
  },
});

export type CourseEntity = Prisma.CourseGetPayload<{ include: typeof courseDetailInclude }>;
export type CourseListEntity = Prisma.CourseGetPayload<{ include: typeof courseWithTeacherInclude }>;
export type CourseLevelValue = CourseLevel;
export type CourseStatusValue = CourseStatus;

export function canManageCourse(user: { id: number; roles: string[] }, teacherId: number) {
  return user.roles.includes('ADMIN') || (user.roles.includes('TEACHER') && user.id === teacherId);
}
