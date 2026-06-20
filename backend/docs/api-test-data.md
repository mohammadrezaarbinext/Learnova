# LearnNova API Test Data

Use this seed when you want a local database with ready-to-test users, courses, videos, enrollments, mock payments, quizzes, questions, and quiz attempts.

## Run

```bash
cd backend
npm run db:prepare
npm run db:seed:test-data
```

`db:seed:test-data` is idempotent. Running it again updates the same fixed demo records.

## Demo Accounts

All demo accounts use this password:

```text
TestPass123
```

```text
ADMIN            +989120000001  admin@learnnova.test
TEACHER          +989120000002  teacher@learnnova.test
STUDENT_ENROLLED +989120000003  student@learnnova.test
STUDENT_BUYER    +989120000004  buyer@learnnova.test
SUPPORT          +989120000005  support@learnnova.test
```

`STUDENT_ENROLLED` already has enrollments, a successful mock payment, and a submitted quiz attempt. `STUDENT_BUYER` is clean and useful for testing `POST /courses/:courseId/purchase` and then starting a fresh quiz attempt.

## Fixed UUIDs

```text
ADMIN_USER       00000000-0000-4000-8000-000000000001
TEACHER_USER     00000000-0000-4000-8000-000000000002
STUDENT_ENROLLED 00000000-0000-4000-8000-000000000003
STUDENT_BUYER    00000000-0000-4000-8000-000000000004
SUPPORT_USER     00000000-0000-4000-8000-000000000005

FREE_COURSE      00000000-0000-4000-8000-000000000101
PAID_COURSE      00000000-0000-4000-8000-000000000102
DRAFT_COURSE     00000000-0000-4000-8000-000000000103

PAYMENT_REQUEST  00000000-0000-4000-8000-000000000401

PAID_QUIZ        00000000-0000-4000-8000-000000000601
DRAFT_QUIZ       00000000-0000-4000-8000-000000000602
TEN_QUESTION_QUIZ 00000000-0000-4000-8000-000000000603
MC_PRACTICE_QUIZ 00000000-0000-4000-8000-000000000604
DESCRIPTIVE_QUIZ 00000000-0000-4000-8000-000000000605
MC_QUESTION      00000000-0000-4000-8000-000000000701
DESC_QUESTION    00000000-0000-4000-8000-000000000702
CORRECT_OPTION   00000000-0000-4000-8000-000000000801
STUDENT_ATTEMPT  00000000-0000-4000-8000-000000000901
DESC_ANSWER      00000000-0000-4000-8000-000000001002
```

## Quick API Checks

If the backend is running, you can run the full smoke test:

```bash
cd backend
npm run test:api:smoke
```

The smoke test logs in with demo accounts, calls public and protected endpoints, purchases the paid course as `STUDENT_BUYER`, starts/submits a quiz attempt, grades a seeded descriptive answer, and prints each request/response.

Socket smoke test:

```bash
cd backend
npm run test:socket:smoke
```

The socket smoke test logs in as `STUDENT_BUYER`, purchases the paid course, starts the 10-question mixed exam, joins the quiz attempt channel, and verifies `socket:joined`, `quiz:state`, and `quiz:timer`.

Login as buyer:

```bash
curl -s http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+989120000004","password":"TestPass123"}'
```

List published courses:

```bash
curl -s http://localhost:3001/api/courses
```

Get paid course:

```bash
curl -s http://localhost:3001/api/courses/00000000-0000-4000-8000-000000000102
```

Purchase paid course as buyer:

```bash
curl -s http://localhost:3001/api/courses/00000000-0000-4000-8000-000000000102/purchase \
  -X POST \
  -H 'Authorization: Bearer <buyerAccessToken>'
```

List buyer payments:

```bash
curl -s http://localhost:3001/api/payments/me \
  -H 'Authorization: Bearer <buyerAccessToken>'
```

List paid course quizzes:

```bash
curl -s http://localhost:3001/api/courses/00000000-0000-4000-8000-000000000102/quizzes \
  -H 'Authorization: Bearer <buyerAccessToken>'
```

Get quiz with questions as student. The response hides `answerKey` and option `isCorrect`:

```bash
curl -s http://localhost:3001/api/quizzes/00000000-0000-4000-8000-000000000601 \
  -H 'Authorization: Bearer <buyerAccessToken>'
```

Get the seeded 10-question mixed exam:

```bash
curl -s http://localhost:3001/api/quizzes/00000000-0000-4000-8000-000000000603 \
  -H 'Authorization: Bearer <buyerAccessToken>'
```

Start a quiz attempt as buyer after purchasing the paid course:

```bash
curl -s http://localhost:3001/api/quizzes/00000000-0000-4000-8000-000000000601/attempts/start \
  -X POST \
  -H 'Authorization: Bearer <buyerAccessToken>'
```

Save a multiple-choice answer:

```bash
curl -s http://localhost:3001/api/quiz-attempts/<attemptUuid>/answers \
  -X POST \
  -H 'Authorization: Bearer <buyerAccessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"questionId":"00000000-0000-4000-8000-000000000701","selectedOptionId":"00000000-0000-4000-8000-000000000801"}'
```

Submit the attempt:

```bash
curl -s http://localhost:3001/api/quiz-attempts/<attemptUuid>/submit \
  -X POST \
  -H 'Authorization: Bearer <buyerAccessToken>'
```

Grade the seeded descriptive answer as admin:

```bash
curl -s http://localhost:3001/api/question-answers/00000000-0000-4000-8000-000000001002/grade \
  -X PATCH \
  -H 'Authorization: Bearer <adminAccessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"score":"4.00","isCorrect":true}'
```

Socket quiz room examples:

```js
const socket = io('http://localhost:3001/quiz');

socket.emit('socket:join', {
  channel: 'quiz:attempt',
  attemptUuid: '<attemptUuid>',
});

socket.on('socket:joined', (payload) => console.log(payload.room));
socket.on('quiz:state', (payload) => console.log(payload.remainingSeconds));
socket.on('quiz:timer', (payload) => console.log(payload.remainingSeconds));
socket.on('quiz:expired', (payload) => console.log('expired', payload.attemptUuid));
socket.on('quiz:submitted', (payload) => console.log('submitted', payload.attemptUuid));

socket.emit('socket:leave', {
  channel: 'quiz:attempt',
  attemptUuid: '<attemptUuid>',
});
```

List enrolled student's enrollments:

```bash
curl -s http://localhost:3001/api/enrollments/me \
  -H 'Authorization: Bearer <studentAccessToken>'
```

Admin list users:

```bash
curl -s http://localhost:3001/api/users \
  -H 'Authorization: Bearer <adminAccessToken>'
```
