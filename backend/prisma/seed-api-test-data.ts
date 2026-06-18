import {
  CourseLevel,
  CourseStatus,
  PaymentProvider,
  PaymentRequestStatus,
  PaymentTransactionStatus,
  Prisma,
  PrismaClient,
  RoleName,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'TestPass123';

const permissions = [
  'users.read',
  'users.create',
  'users.update',
  'users.delete',
  'wallets.read',
  'wallets.update',
  'roles.read',
  'roles.manage',
  'permissions.read',
  'permissions.manage',
  'auth.me',
  'admin.panel.access',
  'teacher.panel.access',
  'student.panel.access',
  'support.panel.access',
  'courses.read',
  'courses.create',
  'courses.update',
  'courses.delete',
  'videos.read',
  'videos.create',
  'videos.update',
  'videos.delete',
  'enrollments.read',
  'enrollments.create',
  'enrollments.delete',
  'payments.read',
  'payments.purchase',
  'payments.manage',
];

const roles: Array<{ name: RoleName; description: string }> = [
  { name: RoleName.ADMIN, description: 'Full platform administrator' },
  { name: RoleName.TEACHER, description: 'Instructor account' },
  { name: RoleName.STUDENT, description: 'Learner account' },
  { name: RoleName.SUPPORT, description: 'Support team account' },
];

const rolePermissions: Record<RoleName, string[]> = {
  [RoleName.ADMIN]: permissions,
  [RoleName.TEACHER]: [
    'teacher.panel.access',
    'student.panel.access',
    'users.read',
    'courses.read',
    'courses.create',
    'courses.update',
    'videos.read',
    'videos.create',
    'videos.update',
    'videos.delete',
    'enrollments.read',
    'payments.read',
  ],
  [RoleName.STUDENT]: [
    'student.panel.access',
    'auth.me',
    'courses.read',
    'videos.read',
    'enrollments.create',
    'payments.purchase',
    'payments.read',
  ],
  [RoleName.SUPPORT]: ['support.panel.access', 'users.read', 'wallets.read', 'courses.read', 'enrollments.read', 'payments.read'],
};

const ids = {
  admin: '00000000-0000-4000-8000-000000000001',
  teacher: '00000000-0000-4000-8000-000000000002',
  student: '00000000-0000-4000-8000-000000000003',
  buyer: '00000000-0000-4000-8000-000000000004',
  support: '00000000-0000-4000-8000-000000000005',
  freeCourse: '00000000-0000-4000-8000-000000000101',
  paidCourse: '00000000-0000-4000-8000-000000000102',
  draftCourse: '00000000-0000-4000-8000-000000000103',
  freeVideoOne: '00000000-0000-4000-8000-000000000201',
  freeVideoTwo: '00000000-0000-4000-8000-000000000202',
  paidPreviewVideo: '00000000-0000-4000-8000-000000000203',
  paidLockedVideo: '00000000-0000-4000-8000-000000000204',
  draftVideo: '00000000-0000-4000-8000-000000000205',
  freeEnrollment: '00000000-0000-4000-8000-000000000301',
  paidEnrollment: '00000000-0000-4000-8000-000000000302',
  paidPaymentRequest: '00000000-0000-4000-8000-000000000401',
  paidPaymentTransaction: '00000000-0000-4000-8000-000000000501',
};

type DemoUserInput = {
  uuid: string;
  fullName: string;
  email: string;
  phone: string;
  roles: RoleName[];
  passwordHash: string;
  walletBalance: string;
  status?: UserStatus;
};

async function seedRolesAndPermissions() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission },
      update: {},
      create: { name: permission },
    });
  }

  for (const [roleName, permissionNames] of Object.entries(rolePermissions) as Array<[RoleName, string[]]>) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    const assignedPermissions = await prisma.permission.findMany({
      where: { name: { in: permissionNames } },
    });

    for (const permission of assignedPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

async function upsertDemoUser(input: DemoUserInput) {
  const user = await prisma.user.upsert({
    where: { phone: input.phone },
    update: {
      uuid: input.uuid,
      fullName: input.fullName,
      email: input.email,
      passwordHash: input.passwordHash,
      status: input.status ?? UserStatus.ACTIVE,
    },
    create: {
      uuid: input.uuid,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash: input.passwordHash,
      status: input.status ?? UserStatus.ACTIVE,
    },
  });

  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {
      balance: input.walletBalance,
      currency: 'IRT',
    },
    create: {
      userId: user.id,
      balance: input.walletBalance,
      currency: 'IRT',
    },
  });

  for (const roleName of input.roles) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });
  }

  return user;
}

async function upsertDemoData() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const admin = await upsertDemoUser({
    uuid: ids.admin,
    fullName: 'Admin Demo',
    email: 'admin@learnnova.test',
    phone: '+989120000001',
    roles: [RoleName.ADMIN],
    passwordHash,
    walletBalance: '10000000.00',
  });

  const teacher = await upsertDemoUser({
    uuid: ids.teacher,
    fullName: 'Teacher Demo',
    email: 'teacher@learnnova.test',
    phone: '+989120000002',
    roles: [RoleName.TEACHER, RoleName.STUDENT],
    passwordHash,
    walletBalance: '500000.00',
  });

  const student = await upsertDemoUser({
    uuid: ids.student,
    fullName: 'Student Demo',
    email: 'student@learnnova.test',
    phone: '+989120000003',
    roles: [RoleName.STUDENT],
    passwordHash,
    walletBalance: '250000.00',
  });

  const buyer = await upsertDemoUser({
    uuid: ids.buyer,
    fullName: 'Buyer Demo',
    email: 'buyer@learnnova.test',
    phone: '+989120000004',
    roles: [RoleName.STUDENT],
    passwordHash,
    walletBalance: '750000.00',
  });

  const support = await upsertDemoUser({
    uuid: ids.support,
    fullName: 'Support Demo',
    email: 'support@learnnova.test',
    phone: '+989120000005',
    roles: [RoleName.SUPPORT, RoleName.STUDENT],
    passwordHash,
    walletBalance: '0.00',
  });

  const freeCourse = await prisma.course.upsert({
    where: { uuid: ids.freeCourse },
    update: {
      title: 'NestJS Foundations',
      description: 'Free starter course for testing public course listing, videos, and enrollments.',
      thumbnailUrl: 'https://cdn.learnnova.test/courses/nestjs-foundations.png',
      price: '0.00',
      level: CourseLevel.BEGINNER,
      status: CourseStatus.PUBLISHED,
      teacherId: teacher.id,
    },
    create: {
      uuid: ids.freeCourse,
      title: 'NestJS Foundations',
      description: 'Free starter course for testing public course listing, videos, and enrollments.',
      thumbnailUrl: 'https://cdn.learnnova.test/courses/nestjs-foundations.png',
      price: '0.00',
      level: CourseLevel.BEGINNER,
      status: CourseStatus.PUBLISHED,
      teacherId: teacher.id,
    },
  });

  const paidCourse = await prisma.course.upsert({
    where: { uuid: ids.paidCourse },
    update: {
      title: 'Advanced NestJS APIs',
      description: 'Paid course for testing mock purchase, payments, protected videos, and enrollments.',
      thumbnailUrl: 'https://cdn.learnnova.test/courses/advanced-nestjs.png',
      price: '250000.00',
      level: CourseLevel.ADVANCED,
      status: CourseStatus.PUBLISHED,
      teacherId: teacher.id,
    },
    create: {
      uuid: ids.paidCourse,
      title: 'Advanced NestJS APIs',
      description: 'Paid course for testing mock purchase, payments, protected videos, and enrollments.',
      thumbnailUrl: 'https://cdn.learnnova.test/courses/advanced-nestjs.png',
      price: '250000.00',
      level: CourseLevel.ADVANCED,
      status: CourseStatus.PUBLISHED,
      teacherId: teacher.id,
    },
  });

  const draftCourse = await prisma.course.upsert({
    where: { uuid: ids.draftCourse },
    update: {
      title: 'Draft Course For Teacher Panel',
      description: 'Draft course for testing teacher-only course management.',
      thumbnailUrl: 'https://cdn.learnnova.test/courses/draft.png',
      price: '125000.00',
      level: CourseLevel.INTERMEDIATE,
      status: CourseStatus.DRAFT,
      teacherId: teacher.id,
    },
    create: {
      uuid: ids.draftCourse,
      title: 'Draft Course For Teacher Panel',
      description: 'Draft course for testing teacher-only course management.',
      thumbnailUrl: 'https://cdn.learnnova.test/courses/draft.png',
      price: '125000.00',
      level: CourseLevel.INTERMEDIATE,
      status: CourseStatus.DRAFT,
      teacherId: teacher.id,
    },
  });

  await upsertVideo(ids.freeVideoOne, freeCourse.id, {
    title: 'Welcome To NestJS',
    description: 'Free intro lesson.',
    videoUrl: 'https://cdn.learnnova.test/videos/nestjs-welcome.mp4',
    durationSeconds: 420,
    orderIndex: 1,
    isFree: true,
  });
  await upsertVideo(ids.freeVideoTwo, freeCourse.id, {
    title: 'Controllers And Providers',
    description: 'Free course main lesson.',
    videoUrl: 'https://cdn.learnnova.test/videos/nestjs-controllers.mp4',
    durationSeconds: 960,
    orderIndex: 2,
    isFree: true,
  });
  await upsertVideo(ids.paidPreviewVideo, paidCourse.id, {
    title: 'Advanced Course Preview',
    description: 'Free preview for the paid course.',
    videoUrl: 'https://cdn.learnnova.test/videos/advanced-preview.mp4',
    durationSeconds: 360,
    orderIndex: 1,
    isFree: true,
  });
  await upsertVideo(ids.paidLockedVideo, paidCourse.id, {
    title: 'Production Auth And Payments',
    description: 'Locked paid lesson.',
    videoUrl: 'https://cdn.learnnova.test/videos/advanced-auth-payments.mp4',
    durationSeconds: 1500,
    orderIndex: 2,
    isFree: false,
  });
  await upsertVideo(ids.draftVideo, draftCourse.id, {
    title: 'Draft Lesson',
    description: 'Teacher draft lesson.',
    videoUrl: 'https://cdn.learnnova.test/videos/draft-lesson.mp4',
    durationSeconds: 600,
    orderIndex: 1,
    isFree: false,
  });

  await upsertEnrollment(ids.freeEnrollment, student.id, freeCourse.id);
  await upsertEnrollment(ids.paidEnrollment, student.id, paidCourse.id);
  await resetBuyerPurchaseState(buyer.id, paidCourse.id);

  const paymentMetadata: Prisma.InputJsonObject = {
    mode: 'mock',
    courseUuid: paidCourse.uuid,
    courseTitle: paidCourse.title,
    seeded: true,
  };
  const paymentRequest = await prisma.paymentRequest.upsert({
    where: { uuid: ids.paidPaymentRequest },
    update: {
      userId: student.id,
      courseId: paidCourse.id,
      amount: paidCourse.price,
      currency: 'IRT',
      status: PaymentRequestStatus.SUCCESS,
      provider: PaymentProvider.MOCK,
      description: `Seeded mock payment for course ${paidCourse.title}`,
      metadata: paymentMetadata,
    },
    create: {
      uuid: ids.paidPaymentRequest,
      userId: student.id,
      courseId: paidCourse.id,
      amount: paidCourse.price,
      currency: 'IRT',
      status: PaymentRequestStatus.SUCCESS,
      provider: PaymentProvider.MOCK,
      description: `Seeded mock payment for course ${paidCourse.title}`,
      metadata: paymentMetadata,
    },
  });

  const providerAuthority = `MOCK-AUTH-${paymentRequest.uuid}`;
  const providerReferenceId = `MOCK-REF-${paymentRequest.uuid}`;
  await prisma.paymentTransaction.upsert({
    where: { uuid: ids.paidPaymentTransaction },
    update: {
      paymentRequestId: paymentRequest.id,
      userId: student.id,
      courseId: paidCourse.id,
      amount: paidCourse.price,
      currency: 'IRT',
      status: PaymentTransactionStatus.SUCCESS,
      provider: PaymentProvider.MOCK,
      providerAuthority,
      providerReferenceId,
      rawRequest: {
        provider: PaymentProvider.MOCK,
        authority: providerAuthority,
        amount: paidCourse.price.toString(),
        currency: paymentRequest.currency,
      },
      rawResponse: {
        provider: PaymentProvider.MOCK,
        referenceId: providerReferenceId,
        status: PaymentTransactionStatus.SUCCESS,
        paid: true,
        seeded: true,
      },
    },
    create: {
      uuid: ids.paidPaymentTransaction,
      paymentRequestId: paymentRequest.id,
      userId: student.id,
      courseId: paidCourse.id,
      amount: paidCourse.price,
      currency: 'IRT',
      status: PaymentTransactionStatus.SUCCESS,
      provider: PaymentProvider.MOCK,
      providerAuthority,
      providerReferenceId,
      rawRequest: {
        provider: PaymentProvider.MOCK,
        authority: providerAuthority,
        amount: paidCourse.price.toString(),
        currency: paymentRequest.currency,
      },
      rawResponse: {
        provider: PaymentProvider.MOCK,
        referenceId: providerReferenceId,
        status: PaymentTransactionStatus.SUCCESS,
        paid: true,
        seeded: true,
      },
    },
  });

  return {
    users: { admin, teacher, student, buyer, support },
    courses: { freeCourse, paidCourse, draftCourse },
    paymentRequest,
  };
}

type DemoVideoInput = {
  title: string;
  description: string;
  videoUrl: string;
  durationSeconds: number;
  orderIndex: number;
  isFree: boolean;
};

function upsertVideo(uuid: string, courseId: number, input: DemoVideoInput) {
  return prisma.video.upsert({
    where: { uuid },
    update: {
      courseId,
      ...input,
    },
    create: {
      uuid,
      courseId,
      ...input,
    },
  });
}

function upsertEnrollment(uuid: string, studentId: number, courseId: number) {
  return prisma.enrollment.upsert({
    where: {
      studentId_courseId: {
        studentId,
        courseId,
      },
    },
    update: {
      uuid,
    },
    create: {
      uuid,
      studentId,
      courseId,
    },
  });
}

async function resetBuyerPurchaseState(buyerId: number, paidCourseId: number) {
  await prisma.paymentRequest.deleteMany({
    where: {
      userId: buyerId,
      courseId: paidCourseId,
    },
  });

  await prisma.enrollment.deleteMany({
    where: {
      studentId: buyerId,
      courseId: paidCourseId,
    },
  });
}

async function main() {
  await seedRolesAndPermissions();
  const seeded = await upsertDemoData();

  console.log('LearnNova API test data seeded.');
  console.table([
    { role: 'ADMIN', phone: seeded.users.admin.phone, password: DEMO_PASSWORD, uuid: seeded.users.admin.uuid },
    { role: 'TEACHER', phone: seeded.users.teacher.phone, password: DEMO_PASSWORD, uuid: seeded.users.teacher.uuid },
    { role: 'STUDENT_ENROLLED', phone: seeded.users.student.phone, password: DEMO_PASSWORD, uuid: seeded.users.student.uuid },
    { role: 'STUDENT_BUYER', phone: seeded.users.buyer.phone, password: DEMO_PASSWORD, uuid: seeded.users.buyer.uuid },
    { role: 'SUPPORT', phone: seeded.users.support.phone, password: DEMO_PASSWORD, uuid: seeded.users.support.uuid },
  ]);
  console.table([
    { type: 'FREE_COURSE', uuid: seeded.courses.freeCourse.uuid, price: seeded.courses.freeCourse.price.toString() },
    { type: 'PAID_COURSE', uuid: seeded.courses.paidCourse.uuid, price: seeded.courses.paidCourse.price.toString() },
    { type: 'DRAFT_COURSE', uuid: seeded.courses.draftCourse.uuid, price: seeded.courses.draftCourse.price.toString() },
    { type: 'PAYMENT_REQUEST', uuid: seeded.paymentRequest.uuid, price: seeded.paymentRequest.amount.toString() },
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
