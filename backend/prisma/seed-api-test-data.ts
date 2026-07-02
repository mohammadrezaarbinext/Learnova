import {
  CourseLevel,
  CourseStatus,
  PaymentProvider,
  PaymentRequestStatus,
  PaymentTransactionStatus,
  Prisma,
  PrismaClient,
  QuestionContentType,
  QuestionType,
  QuizAttemptStatus,
  QuizStatus,
  RoleName,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
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
  'quizzes.read',
  'quizzes.create',
  'quizzes.update',
  'quizzes.delete',
  'questions.read',
  'questions.create',
  'questions.update',
  'questions.delete',
  'quiz_attempts.read',
  'quiz_attempts.create',
  'quiz_attempts.submit',
  'quiz_attempts.grade',
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
    'quizzes.read',
    'quizzes.create',
    'quizzes.update',
    'quizzes.delete',
    'questions.read',
    'questions.create',
    'questions.update',
    'questions.delete',
    'quiz_attempts.read',
    'quiz_attempts.grade',
  ],
  [RoleName.STUDENT]: [
    'student.panel.access',
    'auth.me',
    'courses.read',
    'videos.read',
    'enrollments.create',
    'payments.purchase',
    'payments.read',
    'quizzes.read',
    'questions.read',
    'quiz_attempts.create',
    'quiz_attempts.submit',
  ],
  [RoleName.SUPPORT]: [
    'support.panel.access',
    'users.read',
    'wallets.read',
    'courses.read',
    'enrollments.read',
    'payments.read',
    'quizzes.read',
    'quiz_attempts.read',
  ],
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
  paidQuiz: '00000000-0000-4000-8000-000000000601',
  draftQuiz: '00000000-0000-4000-8000-000000000602',
  tenQuestionQuiz: '00000000-0000-4000-8000-000000000603',
  multipleChoiceQuiz: '00000000-0000-4000-8000-000000000604',
  descriptiveQuiz: '00000000-0000-4000-8000-000000000605',
  multipleChoiceQuestion: '00000000-0000-4000-8000-000000000701',
  descriptiveQuestion: '00000000-0000-4000-8000-000000000702',
  optionA: '00000000-0000-4000-8000-000000000801',
  optionB: '00000000-0000-4000-8000-000000000802',
  optionC: '00000000-0000-4000-8000-000000000803',
  studentQuizAttempt: '00000000-0000-4000-8000-000000000901',
  multipleChoiceAnswer: '00000000-0000-4000-8000-000000001001',
  descriptiveAnswer: '00000000-0000-4000-8000-000000001002',
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
    where: { uuid: input.uuid },
    update: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
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
    phone: '09120000001',
    roles: [RoleName.ADMIN],
    passwordHash,
    walletBalance: '10000000.00',
  });

  const teacher = await upsertDemoUser({
    uuid: ids.teacher,
    fullName: 'Teacher Demo',
    email: 'teacher@learnnova.test',
    phone: '09120000002',
    roles: [RoleName.TEACHER, RoleName.STUDENT],
    passwordHash,
    walletBalance: '500000.00',
  });

  const student = await upsertDemoUser({
    uuid: ids.student,
    fullName: 'Student Demo',
    email: 'student@learnnova.test',
    phone: '09120000003',
    roles: [RoleName.STUDENT],
    passwordHash,
    walletBalance: '250000.00',
  });

  const buyer = await upsertDemoUser({
    uuid: ids.buyer,
    fullName: 'Buyer Demo',
    email: 'buyer@learnnova.test',
    phone: '09120000004',
    roles: [RoleName.STUDENT],
    passwordHash,
    walletBalance: '750000.00',
  });

  const support = await upsertDemoUser({
    uuid: ids.support,
    fullName: 'Support Demo',
    email: 'support@learnnova.test',
    phone: '09120000005',
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

  const paidQuiz = await prisma.quiz.upsert({
    where: { uuid: ids.paidQuiz },
    update: {
      courseId: paidCourse.id,
      title: 'Advanced NestJS Final Exam',
      description: 'Published quiz for testing questions, attempts, submit, and grading.',
      durationMinutes: 45,
      startsAt: null,
      endsAt: null,
      status: QuizStatus.PUBLISHED,
    },
    create: {
      uuid: ids.paidQuiz,
      courseId: paidCourse.id,
      title: 'Advanced NestJS Final Exam',
      description: 'Published quiz for testing questions, attempts, submit, and grading.',
      durationMinutes: 45,
      startsAt: null,
      endsAt: null,
      status: QuizStatus.PUBLISHED,
    },
  });

  const draftQuiz = await prisma.quiz.upsert({
    where: { uuid: ids.draftQuiz },
    update: {
      courseId: draftCourse.id,
      title: 'Draft Teacher Quiz',
      description: 'Draft quiz for testing teacher/admin visibility.',
      durationMinutes: 30,
      startsAt: null,
      endsAt: null,
      status: QuizStatus.DRAFT,
    },
    create: {
      uuid: ids.draftQuiz,
      courseId: draftCourse.id,
      title: 'Draft Teacher Quiz',
      description: 'Draft quiz for testing teacher/admin visibility.',
      durationMinutes: 30,
      startsAt: null,
      endsAt: null,
      status: QuizStatus.DRAFT,
    },
  });

  const multipleChoiceQuestion = await prisma.question.upsert({
    where: { uuid: ids.multipleChoiceQuestion },
    update: {
      quizId: paidQuiz.id,
      type: QuestionType.MULTIPLE_CHOICE,
      contentType: QuestionContentType.TEXT,
      content: 'Which NestJS concept is used for dependency injection?',
      imageUrl: null,
      points: '1.00',
      orderIndex: 1,
      answerKey: 'provider',
    },
    create: {
      uuid: ids.multipleChoiceQuestion,
      quizId: paidQuiz.id,
      type: QuestionType.MULTIPLE_CHOICE,
      contentType: QuestionContentType.TEXT,
      content: 'Which NestJS concept is used for dependency injection?',
      imageUrl: null,
      points: '1.00',
      orderIndex: 1,
      answerKey: 'provider',
    },
  });

  await upsertQuestionOption(ids.optionA, multipleChoiceQuestion.id, {
    contentType: QuestionContentType.TEXT,
    content: 'Provider',
    imageUrl: null,
    orderIndex: 1,
    isCorrect: true,
  });
  await upsertQuestionOption(ids.optionB, multipleChoiceQuestion.id, {
    contentType: QuestionContentType.TEXT,
    content: 'Migration',
    imageUrl: null,
    orderIndex: 2,
    isCorrect: false,
  });
  await upsertQuestionOption(ids.optionC, multipleChoiceQuestion.id, {
    contentType: QuestionContentType.TEXT,
    content: 'Stylesheet',
    imageUrl: null,
    orderIndex: 3,
    isCorrect: false,
  });

  const descriptiveQuestion = await prisma.question.upsert({
    where: { uuid: ids.descriptiveQuestion },
    update: {
      quizId: paidQuiz.id,
      type: QuestionType.DESCRIPTIVE,
      contentType: QuestionContentType.TEXT,
      content: 'Explain why guards are useful in NestJS APIs.',
      imageUrl: null,
      points: '4.00',
      orderIndex: 2,
      answerKey: null,
    },
    create: {
      uuid: ids.descriptiveQuestion,
      quizId: paidQuiz.id,
      type: QuestionType.DESCRIPTIVE,
      contentType: QuestionContentType.TEXT,
      content: 'Explain why guards are useful in NestJS APIs.',
      imageUrl: null,
      points: '4.00',
      orderIndex: 2,
      answerKey: null,
    },
  });

  const studentAttempt = await prisma.quizAttempt.upsert({
    where: { uuid: ids.studentQuizAttempt },
    update: {
      quizId: paidQuiz.id,
      studentId: student.id,
      status: QuizAttemptStatus.SUBMITTED,
      score: '1.00',
      submittedAt: new Date(),
    },
    create: {
      uuid: ids.studentQuizAttempt,
      quizId: paidQuiz.id,
      studentId: student.id,
      status: QuizAttemptStatus.SUBMITTED,
      score: '1.00',
      submittedAt: new Date(),
    },
  });

  await prisma.questionAnswer.upsert({
    where: { uuid: ids.multipleChoiceAnswer },
    update: {
      attemptId: studentAttempt.id,
      questionId: multipleChoiceQuestion.id,
      selectedOptionId: (await prisma.questionOption.findUniqueOrThrow({ where: { uuid: ids.optionA } })).id,
      answerContentType: null,
      answerContent: Prisma.DbNull,
      answerImageUrl: null,
      score: '1.00',
      isCorrect: true,
      gradedAt: new Date(),
    },
    create: {
      uuid: ids.multipleChoiceAnswer,
      attemptId: studentAttempt.id,
      questionId: multipleChoiceQuestion.id,
      selectedOptionId: (await prisma.questionOption.findUniqueOrThrow({ where: { uuid: ids.optionA } })).id,
      answerContentType: null,
      answerImageUrl: null,
      score: '1.00',
      isCorrect: true,
      gradedAt: new Date(),
    },
  });

  await prisma.questionAnswer.upsert({
    where: { uuid: ids.descriptiveAnswer },
    update: {
      attemptId: studentAttempt.id,
      questionId: descriptiveQuestion.id,
      selectedOptionId: null,
      answerContentType: QuestionContentType.TEXT,
      answerContent: 'Guards protect routes before handlers run and centralize authorization logic.',
      answerImageUrl: null,
      score: null,
      isCorrect: null,
      gradedAt: null,
    },
    create: {
      uuid: ids.descriptiveAnswer,
      attemptId: studentAttempt.id,
      questionId: descriptiveQuestion.id,
      selectedOptionId: null,
      answerContentType: QuestionContentType.TEXT,
      answerContent: 'Guards protect routes before handlers run and centralize authorization logic.',
      answerImageUrl: null,
      score: null,
      isCorrect: null,
      gradedAt: null,
    },
  });

  const tenQuestionQuiz = await upsertQuiz(ids.tenQuestionQuiz, paidCourse.id, {
    title: 'Full Mixed Exam - 10 Questions',
    description: 'Published 10-question exam with multiple-choice and descriptive questions.',
    durationMinutes: 60,
    status: QuizStatus.PUBLISHED,
  });
  await seedTenQuestionQuiz(tenQuestionQuiz.id);

  const multipleChoiceQuiz = await upsertQuiz(ids.multipleChoiceQuiz, freeCourse.id, {
    title: 'Multiple Choice Practice Exam',
    description: 'Short published exam with only multiple-choice questions.',
    durationMinutes: 20,
    status: QuizStatus.PUBLISHED,
  });
  await seedMultipleChoicePracticeQuiz(multipleChoiceQuiz.id);

  const descriptiveQuiz = await upsertQuiz(ids.descriptiveQuiz, paidCourse.id, {
    title: 'Descriptive Practice Exam',
    description: 'Short published exam with descriptive questions.',
    durationMinutes: 25,
    status: QuizStatus.PUBLISHED,
  });
  await seedDescriptivePracticeQuiz(descriptiveQuiz.id);

  await resetBuyerQuizAttemptState(buyer.id, [paidQuiz.id, tenQuestionQuiz.id, multipleChoiceQuiz.id, descriptiveQuiz.id]);

  return {
    users: { admin, teacher, student, buyer, support },
    courses: { freeCourse, paidCourse, draftCourse },
    quizzes: { paidQuiz, draftQuiz, tenQuestionQuiz, multipleChoiceQuiz, descriptiveQuiz },
    questions: { multipleChoiceQuestion, descriptiveQuestion },
    attempt: studentAttempt,
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

type DemoQuestionOptionInput = {
  contentType: QuestionContentType;
  content: Prisma.InputJsonValue;
  imageUrl: string | null;
  orderIndex: number;
  isCorrect: boolean;
};

function upsertQuestionOption(uuid: string, questionId: number, input: DemoQuestionOptionInput) {
  return prisma.questionOption.upsert({
    where: { uuid },
    update: {
      questionId,
      ...input,
    },
    create: {
      uuid,
      questionId,
      ...input,
    },
  });
}

type DemoQuizInput = {
  title: string;
  description: string;
  durationMinutes: number;
  status: QuizStatus;
};

function upsertQuiz(uuid: string, courseId: number, input: DemoQuizInput) {
  return prisma.quiz.upsert({
    where: { uuid },
    update: {
      courseId,
      title: input.title,
      description: input.description,
      durationMinutes: input.durationMinutes,
      startsAt: null,
      endsAt: null,
      status: input.status,
    },
    create: {
      uuid,
      courseId,
      title: input.title,
      description: input.description,
      durationMinutes: input.durationMinutes,
      startsAt: null,
      endsAt: null,
      status: input.status,
    },
  });
}

async function seedTenQuestionQuiz(quizId: number) {
  const questions = [
    { type: QuestionType.MULTIPLE_CHOICE, content: 'Which decorator defines a NestJS controller?', answer: '@Controller' },
    { type: QuestionType.MULTIPLE_CHOICE, content: 'Which file usually bootstraps a NestJS app?', answer: 'main.ts' },
    { type: QuestionType.DESCRIPTIVE, content: 'Explain the role of dependency injection in NestJS.' },
    { type: QuestionType.MULTIPLE_CHOICE, content: 'Which class is commonly used to protect routes?', answer: 'Guard' },
    { type: QuestionType.MULTIPLE_CHOICE, content: 'Which ORM is used internally in this backend?', answer: 'Prisma' },
    { type: QuestionType.DESCRIPTIVE, content: 'Describe how modules help organize a NestJS backend.' },
    { type: QuestionType.MULTIPLE_CHOICE, content: 'Which HTTP status family means client error?', answer: '4xx' },
    { type: QuestionType.MULTIPLE_CHOICE, content: 'Which token type is sent in Authorization Bearer?', answer: 'JWT' },
    { type: QuestionType.MULTIPLE_CHOICE, content: 'Which command syncs Prisma schema in local dev?', answer: 'prisma db push' },
    { type: QuestionType.DESCRIPTIVE, content: 'Explain why quiz answer keys must be hidden from students.' },
  ];

  for (const [index, question] of questions.entries()) {
    const questionNumber = index + 1;
    const questionUuid = fixedUuid(710 + index);

    if (question.type === QuestionType.DESCRIPTIVE) {
      await upsertDemoQuestion(questionUuid, quizId, {
        type: QuestionType.DESCRIPTIVE,
        contentType: QuestionContentType.TEXT,
        content: question.content,
        imageUrl: null,
        points: '4.00',
        orderIndex: questionNumber,
        answerKey: null,
        options: [],
      });
      continue;
    }

    const baseOptionNumber = 820 + index * 4;
    await upsertDemoQuestion(questionUuid, quizId, {
      type: QuestionType.MULTIPLE_CHOICE,
      contentType: QuestionContentType.TEXT,
      content: question.content,
      imageUrl: null,
      points: '1.00',
      orderIndex: questionNumber,
      answerKey: question.answer,
      options: [
        {
          uuid: fixedUuid(baseOptionNumber),
          contentType: QuestionContentType.TEXT,
          content: question.answer ?? 'Correct',
          imageUrl: null,
          orderIndex: 1,
          isCorrect: true,
        },
        {
          uuid: fixedUuid(baseOptionNumber + 1),
          contentType: QuestionContentType.TEXT,
          content: 'Repository',
          imageUrl: null,
          orderIndex: 2,
          isCorrect: false,
        },
        {
          uuid: fixedUuid(baseOptionNumber + 2),
          contentType: QuestionContentType.TEXT,
          content: 'Stylesheet',
          imageUrl: null,
          orderIndex: 3,
          isCorrect: false,
        },
        {
          uuid: fixedUuid(baseOptionNumber + 3),
          contentType: QuestionContentType.TEXT,
          content: 'Webpack plugin',
          imageUrl: null,
          orderIndex: 4,
          isCorrect: false,
        },
      ],
    });
  }
}

async function seedMultipleChoicePracticeQuiz(quizId: number) {
  for (let index = 0; index < 3; index += 1) {
    await upsertDemoQuestion(fixedUuid(760 + index), quizId, {
      type: QuestionType.MULTIPLE_CHOICE,
      contentType: QuestionContentType.TEXT,
      content: `Practice MC question ${index + 1}`,
      imageUrl: null,
      points: '1.00',
      orderIndex: index + 1,
      answerKey: 'A',
      options: [
        {
          uuid: fixedUuid(900 + index * 3),
          contentType: QuestionContentType.TEXT,
          content: 'A',
          imageUrl: null,
          orderIndex: 1,
          isCorrect: true,
        },
        {
          uuid: fixedUuid(901 + index * 3),
          contentType: QuestionContentType.TEXT,
          content: 'B',
          imageUrl: null,
          orderIndex: 2,
          isCorrect: false,
        },
        {
          uuid: fixedUuid(902 + index * 3),
          contentType: QuestionContentType.TEXT,
          content: 'C',
          imageUrl: null,
          orderIndex: 3,
          isCorrect: false,
        },
      ],
    });
  }
}

async function seedDescriptivePracticeQuiz(quizId: number) {
  const prompts = [
    'Describe how authentication and authorization differ.',
    'Explain why transactions matter when creating payment and enrollment records.',
    'Describe how you would model course progress for students.',
  ];

  for (const [index, prompt] of prompts.entries()) {
    await upsertDemoQuestion(fixedUuid(780 + index), quizId, {
      type: QuestionType.DESCRIPTIVE,
      contentType: QuestionContentType.TEXT,
      content: prompt,
      imageUrl: null,
      points: '5.00',
      orderIndex: index + 1,
      answerKey: null,
      options: [],
    });
  }
}

type DemoQuestionInput = {
  type: QuestionType;
  contentType: QuestionContentType;
  content: Prisma.InputJsonValue;
  imageUrl: string | null;
  points: string;
  orderIndex: number;
  answerKey: Prisma.InputJsonValue | null;
  options: Array<DemoQuestionOptionInput & { uuid: string }>;
};

async function upsertDemoQuestion(uuid: string, quizId: number, input: DemoQuestionInput) {
  const question = await prisma.question.upsert({
    where: { uuid },
    update: {
      quizId,
      type: input.type,
      contentType: input.contentType,
      content: input.content,
      imageUrl: input.imageUrl,
      points: input.points,
      orderIndex: input.orderIndex,
      answerKey: input.answerKey ?? Prisma.DbNull,
    },
    create: {
      uuid,
      quizId,
      type: input.type,
      contentType: input.contentType,
      content: input.content,
      imageUrl: input.imageUrl,
      points: input.points,
      orderIndex: input.orderIndex,
      answerKey: input.answerKey ?? undefined,
    },
  });

  if (input.options.length === 0) {
    await prisma.questionOption.deleteMany({ where: { questionId: question.id } });
    return question;
  }

  for (const option of input.options) {
    await upsertQuestionOption(option.uuid, question.id, option);
  }

  await prisma.questionOption.deleteMany({
    where: {
      questionId: question.id,
      uuid: {
        notIn: input.options.map((option) => option.uuid),
      },
    },
  });

  return question;
}

function fixedUuid(suffix: number): string {
  return `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
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

async function resetBuyerQuizAttemptState(buyerId: number, quizIds: number[]) {
  await prisma.quizAttempt.deleteMany({
    where: {
      studentId: buyerId,
      quizId: {
        in: quizIds,
      },
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
    { type: 'PAID_QUIZ', uuid: seeded.quizzes.paidQuiz.uuid, price: '-' },
    { type: 'DRAFT_QUIZ', uuid: seeded.quizzes.draftQuiz.uuid, price: '-' },
    { type: 'TEN_QUESTION_QUIZ', uuid: seeded.quizzes.tenQuestionQuiz.uuid, price: '-' },
    { type: 'MC_PRACTICE_QUIZ', uuid: seeded.quizzes.multipleChoiceQuiz.uuid, price: '-' },
    { type: 'DESCRIPTIVE_QUIZ', uuid: seeded.quizzes.descriptiveQuiz.uuid, price: '-' },
    { type: 'MC_QUESTION', uuid: seeded.questions.multipleChoiceQuestion.uuid, price: '-' },
    { type: 'DESC_QUESTION', uuid: seeded.questions.descriptiveQuestion.uuid, price: '-' },
    { type: 'STUDENT_ATTEMPT', uuid: seeded.attempt.uuid, price: '-' },
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
