# LearnNova API Test Data

Use this seed when you want a local database with ready-to-test users, courses, videos, enrollments, and a mock payment.

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

`STUDENT_ENROLLED` already has enrollments and a successful mock payment. `STUDENT_BUYER` is clean and useful for testing `POST /courses/:courseId/purchase`.

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
```

## Quick API Checks

If the backend is running, you can run the full smoke test:

```bash
cd backend
npm run test:api:smoke
```

The smoke test logs in with demo accounts, calls public and protected endpoints, purchases the paid course as `STUDENT_BUYER`, and prints each request/response.

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
