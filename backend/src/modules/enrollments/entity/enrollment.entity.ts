import { Prisma } from '@prisma/client';

export const enrollmentWithCourseInclude = Prisma.validator<Prisma.EnrollmentInclude>()({
  course: {
    select: {
      id: true,
      uuid: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      price: true,
      level: true,
      status: true,
      teacherId: true,
      createdAt: true,
      updatedAt: true,
    },
  },
});

export type EnrollmentEntity = Prisma.EnrollmentGetPayload<{ include: typeof enrollmentWithCourseInclude }>;

export function serializeEnrollment(enrollment: EnrollmentEntity) {
  return {
    id: enrollment.id,
    uuid: enrollment.uuid,
    studentId: enrollment.studentId,
    courseId: enrollment.courseId,
    course: enrollment.course,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
  };
}
