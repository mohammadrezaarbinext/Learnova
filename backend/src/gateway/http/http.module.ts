import { Module } from '@nestjs/common';
import { AuthModule } from '../../modules/auth/auth.module';
import { CoursesModule } from '../../modules/courses/courses.module';
import { EnrollmentsModule } from '../../modules/enrollments/enrollments.module';
import { PaymentsModule } from '../../modules/payments/payments.module';
import { QuestionsModule } from '../../modules/questions/questions.module';
import { QuizAttemptsModule } from '../../modules/quiz-attempts/quiz-attempts.module';
import { QuizzesModule } from '../../modules/quizzes/quizzes.module';
import { UsersModule } from '../../modules/users/users.module';
import { VideosModule } from '../../modules/videos/videos.module';
import { WalletsModule } from '../../modules/wallets/wallets.module';
import { AuthController } from './controllers/auth.controller';
import { CoursesController } from './controllers/courses.controller';
import { EnrollmentsController } from './controllers/enrollments.controller';
import { PaymentsController } from './controllers/payments.controller';
import { QuestionsController } from './controllers/questions.controller';
import { QuizAttemptsController } from './controllers/quiz-attempts.controller';
import { QuizzesController } from './controllers/quizzes.controller';
import { UsersController } from './controllers/users.controller';
import { VideosController } from './controllers/videos.controller';
import { WalletsController } from './controllers/wallets.controller';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    WalletsModule,
    CoursesModule,
    VideosModule,
    EnrollmentsModule,
    PaymentsModule,
    QuizzesModule,
    QuestionsModule,
    QuizAttemptsModule,
  ],
  controllers: [
    AuthController,
    UsersController,
    WalletsController,
    CoursesController,
    VideosController,
    EnrollmentsController,
    PaymentsController,
    QuizzesController,
    QuestionsController,
    QuizAttemptsController,
  ],
})
export class HttpModule {}
