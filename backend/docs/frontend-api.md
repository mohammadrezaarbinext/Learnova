# LearnNova Backend API Guide

This document is for frontend integration with the LearnNova backend.

## Base URLs

Local API:

```text
http://localhost:3001/api
```

Swagger UI:

```text
http://localhost:3001/api/docs
```

Swagger can call the APIs directly. For protected routes, click **Authorize** and paste the JWT access token.

## Required Headers

JSON requests:

```http
Content-Type: application/json
```

Protected requests:

```http
Authorization: Bearer <accessToken>
```

## Auth Flow

1. Call `POST /auth/otp` whenever an OTP is needed, with `type` set to `REGISTER`, `LOGIN`, or `CHANGE_PASSWORD`.
2. Register flow: call `POST /auth/otp` with `type: "REGISTER"`, read the OTP from backend logs, then call `POST /auth/register`.
3. Login flow: call `POST /auth/login` with phone/password, or call `POST /auth/otp` with `type: "LOGIN"` and then login with phone/OTP.
4. Store the returned `accessToken` on the client.
5. Send `Authorization: Bearer <accessToken>` for protected requests.
6. Use `GET /auth/me` to hydrate the current user after app refresh.
7. For paid courses, call `POST /courses/:courseId/purchase` instead of direct enrollment. The current payment provider is mocked and returns a successful payment immediately.

The backend stores JWT session metadata in Redis. If the Redis session expires or is removed, the JWT is rejected.

OTP is currently mocked. The backend logs it in the terminal:

```text
LearnNova OTP generated | type=REGISTER | phone=+989121234567 | otp=123456 | expiresIn=120s
```

## User Shape

```json
{
  "id": 1,
  "uuid": "df030de8-6479-4837-a03d-65836fa80d60",
  "fullName": "Sara Ahmadi",
  "email": null,
  "phone": "+989121234567",
  "status": "ACTIVE",
  "wallet": {
    "id": 1,
    "uuid": "3d6f3206-6277-449c-a782-e58ac3ddc5a1",
    "userId": 1,
    "balance": "0.00",
    "currency": "IRT",
    "createdAt": "2026-06-18T08:45:00.000Z",
    "updatedAt": "2026-06-18T08:45:00.000Z"
  },
  "enrollments": [
    {
      "id": 1,
      "uuid": "7c93df3c-c2f0-4f7f-88d4-78a6fd2a3e41",
      "studentId": 1,
      "courseId": 1,
      "course": {
        "id": 1,
        "uuid": "17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec",
        "title": "NestJS Foundations",
        "description": "Build production-ready APIs with NestJS.",
        "thumbnailUrl": null,
        "price": "0.00",
        "level": "BEGINNER",
        "status": "PUBLISHED",
        "teacherId": 2,
        "createdAt": "2026-06-18T08:45:00.000Z",
        "updatedAt": "2026-06-18T08:45:00.000Z"
      },
      "createdAt": "2026-06-18T08:45:00.000Z",
      "updatedAt": "2026-06-18T08:45:00.000Z"
    }
  ],
  "roles": ["STUDENT"],
  "permissions": ["student.panel.access", "auth.me", "courses.read", "videos.read", "enrollments.create", "payments.purchase", "payments.read"],
  "createdAt": "2026-06-18T08:45:00.000Z",
  "updatedAt": "2026-06-18T08:45:00.000Z"
}
```

## Auth Endpoints

### Request OTP

```http
POST /auth/otp
```

Request:

```json
{
  "phone": "+989121234567",
  "type": "REGISTER"
}
```

Allowed `type` values:

```text
REGISTER
LOGIN
CHANGE_PASSWORD
```

Response:

```json
{
  "ok": true,
  "message": "OTP generated and logged by backend."
}
```

### Register

```http
POST /auth/register
```

Request:

```json
{
  "phone": "+989121234567",
  "otp": "123456",
  "password": "StrongPass123"
}
```

Register only accepts phone, OTP, and password. The backend uses the phone as the initial display name.

Response:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": 1,
    "uuid": "df030de8-6479-4837-a03d-65836fa80d60",
    "fullName": "+989121234567",
    "email": null,
    "phone": "+989121234567",
    "status": "ACTIVE",
    "wallet": {
      "id": 1,
      "uuid": "3d6f3206-6277-449c-a782-e58ac3ddc5a1",
      "userId": 1,
      "balance": "0.00",
      "currency": "IRT",
      "createdAt": "2026-06-18T08:45:00.000Z",
      "updatedAt": "2026-06-18T08:45:00.000Z"
    },
    "roles": ["STUDENT"],
    "permissions": ["student.panel.access", "auth.me", "courses.read", "videos.read", "enrollments.create", "payments.purchase", "payments.read"],
    "createdAt": "2026-06-18T08:45:00.000Z",
    "updatedAt": "2026-06-18T08:45:00.000Z"
  }
}
```

Notes:
- Creates a user.
- Creates the user wallet automatically.
- Assigns the `STUDENT` role by default.
- If the phone already belongs to a registered account, the backend verifies OTP first and then returns conflict.

### Login With Password Or OTP

```http
POST /auth/login
```

Request:

```json
{
  "phone": "+989121234567",
  "password": "StrongPass123"
}
```

Or:

```json
{
  "phone": "+989121234567",
  "otp": "123456"
}
```

Response:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": 1,
    "uuid": "df030de8-6479-4837-a03d-65836fa80d60",
    "fullName": "Sara Ahmadi",
    "email": "sara@learnnova.com",
    "phone": "+989121234567",
    "status": "ACTIVE",
    "wallet": {
      "id": 1,
      "uuid": "3d6f3206-6277-449c-a782-e58ac3ddc5a1",
      "userId": 1,
      "balance": "0.00",
      "currency": "IRT",
      "createdAt": "2026-06-18T08:45:00.000Z",
      "updatedAt": "2026-06-18T08:45:00.000Z"
    },
    "roles": ["STUDENT"],
    "permissions": ["student.panel.access", "auth.me", "courses.read", "videos.read", "enrollments.create", "payments.purchase", "payments.read"],
    "createdAt": "2026-06-18T08:45:00.000Z",
    "updatedAt": "2026-06-18T08:45:00.000Z"
  }
}
```

### Change Password

```http
POST /auth/change-password
```

Request:

```json
{
  "phone": "+989121234567",
  "otp": "123456",
  "password": "NewStrongPass123"
}
```

Response:

```json
{
  "ok": true,
  "message": "Password changed successfully."
}
```

### Current User

```http
GET /auth/me
```

Auth:

```http
Authorization: Bearer <accessToken>
```

Response: user object with wallet, roles, permissions, and the current user's enrollments. Enrollment course objects do not include videos.

Required permission:

```text
auth.me
```

## User Endpoints

All user endpoints require JWT auth.

### List Users

```http
GET /users
```

Required permission:

```text
users.read
```

Response: `User[]`

### Get User

```http
GET /users/:uuid
```

Required permission:

```text
users.read
```

Response: `User`

### Update User

```http
PATCH /users/:uuid
```

Required permission:

```text
users.update
```

Request fields are optional:

```json
{
  "fullName": "Updated Name",
  "email": "updated@learnnova.com",
  "phone": "+989120000000",
  "status": "ACTIVE"
}
```

Allowed `status` values:

```text
ACTIVE
BLOCKED
PENDING
```

Response: updated `User`

### Delete User

```http
DELETE /users/:uuid
```

Required permission:

```text
users.delete
```

Response:

```json
{
  "id": 1,
  "uuid": "df030de8-6479-4837-a03d-65836fa80d60",
  "deleted": true
}
```

## Wallet Endpoints

All wallet endpoints require JWT auth.

### Current User Wallet

```http
GET /wallets/me
```

Response:

```json
{
  "id": 1,
  "uuid": "3d6f3206-6277-449c-a782-e58ac3ddc5a1",
  "userId": 1,
  "balance": "0.00",
  "currency": "IRT",
  "createdAt": "2026-06-18T08:45:00.000Z",
  "updatedAt": "2026-06-18T08:45:00.000Z"
}
```

### Get User Wallet

```http
GET /wallets/:userUuid
```

Required permission:

```text
wallets.read
```

Response: `Wallet`

### Update User Wallet Balance

```http
PATCH /wallets/:userUuid/balance
```

Required permission:

```text
wallets.update
```

Request:

```json
{
  "balance": "250000.00"
}
```

Response: updated `Wallet`

## Course Endpoints

### List Courses

```http
GET /courses
```

Public. Returns published courses by default.

Optional query params:

```text
search
level=BEGINNER|INTERMEDIATE|ADVANCED
status=DRAFT|PUBLISHED|ARCHIVED
teacherId=<teacherUuid>
```

### Get Course Details

```http
GET /courses/:id
```

Public. `:id` is the course uuid. Includes teacher info only. Videos are not embedded in course responses; call `GET /courses/:courseId/videos` to load videos.

### Create Course

```http
POST /courses
```

Required permission:

```text
courses.create
```

Request:

```json
{
  "title": "NestJS Foundations",
  "description": "Build production-ready APIs with NestJS.",
  "thumbnailUrl": "https://cdn.learnnova.test/courses/nestjs.png",
  "price": "0.00",
  "level": "BEGINNER",
  "status": "DRAFT"
}
```

Only `TEACHER` or `ADMIN` can create courses. Teacher is current user unless an admin passes `teacherId`.

### Update Course

```http
PATCH /courses/:id
```

Required permission:

```text
courses.update
```

Teacher can update only own courses. Admin can update any course.

### Delete Course

```http
DELETE /courses/:id
```

Required permission:

```text
courses.delete
```

### My Teaching Courses

```http
GET /courses/me/teaching
```

Required permission:

```text
courses.read
```

## Video Endpoints

### List Course Videos

```http
GET /courses/:courseId/videos
```

Required permission:

```text
videos.read
```

Returns videos ordered by `orderIndex`. `videoUrl` is returned only when the video is free, the user is enrolled, the user is the course teacher, or the user is admin.

### Create Video

```http
POST /courses/:courseId/videos
```

Required permission:

```text
videos.create
```

Request:

```json
{
  "title": "Introduction",
  "description": "Welcome and course overview.",
  "videoUrl": "https://cdn.learnnova.test/videos/intro.mp4",
  "durationSeconds": 420,
  "orderIndex": 1,
  "isFree": true
}
```

Only course owner teacher or admin can create videos.

### Update Video

```http
PATCH /videos/:id
```

Required permission:

```text
videos.update
```

### Delete Video

```http
DELETE /videos/:id
```

Required permission:

```text
videos.delete
```

## Enrollment Endpoints

### Enroll In Course

```http
POST /courses/:courseId/enroll
```

Required permission:

```text
enrollments.create
```

Enrolls the current user directly. Duplicate enrollments are rejected. Frontend should use this direct enrollment flow for free courses. For paid courses, use `POST /courses/:courseId/purchase` so the backend creates the payment request, payment transaction, and enrollment together.

### My Enrollments

```http
GET /enrollments/me
```

Returns current user enrollments with course info. Videos are not embedded in enrollment responses.

### Course Enrollments

```http
GET /enrollments/course/:courseId
```

Required permission:

```text
enrollments.read
```

Teacher can view only own course enrollments. Admin and support can view all.

### Delete Enrollment

```http
DELETE /enrollments/:id
```

Required permission:

```text
enrollments.delete
```

Admin only for now.

## Payment Endpoints

All payment endpoints require JWT auth. The current provider is `MOCK`: purchase requests are completed immediately, a successful transaction is created, and the user is enrolled in the course inside one backend transaction.

### Purchase Course

```http
POST /courses/:courseId/purchase
```

`:courseId` is the course uuid.

Required permission:

```text
payments.purchase
```

Request body: none.

Response:

```json
{
  "message": "Course purchased successfully with mock payment",
  "alreadyEnrolled": false,
  "payment": {
    "id": 1,
    "uuid": "54c0ef37-e142-4b2f-93a1-587087452dd8",
    "userId": 1,
    "courseId": 1,
    "amount": "250000.00",
    "currency": "IRT",
    "status": "SUCCESS",
    "provider": "MOCK",
    "description": "Mock payment for course NestJS Foundations",
    "metadata": {
      "mode": "mock",
      "courseUuid": "17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec",
      "courseTitle": "NestJS Foundations"
    },
    "course": {
      "id": 1,
      "uuid": "17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec",
      "title": "NestJS Foundations",
      "description": "Build production-ready APIs with NestJS.",
      "thumbnailUrl": null,
      "price": "250000.00",
      "level": "BEGINNER",
      "status": "PUBLISHED",
      "teacherId": 2,
      "createdAt": "2026-06-18T08:45:00.000Z",
      "updatedAt": "2026-06-18T08:45:00.000Z"
    },
    "transactions": [
      {
        "id": 1,
        "uuid": "b91e4df2-e06f-495d-88f2-36287df9206f",
        "paymentRequestId": 1,
        "userId": 1,
        "courseId": 1,
        "amount": "250000.00",
        "currency": "IRT",
        "status": "SUCCESS",
        "provider": "MOCK",
        "providerAuthority": "MOCK-AUTH-54c0ef37-e142-4b2f-93a1-587087452dd8",
        "providerReferenceId": "MOCK-REF-54c0ef37-e142-4b2f-93a1-587087452dd8",
        "rawRequest": {
          "provider": "MOCK",
          "authority": "MOCK-AUTH-54c0ef37-e142-4b2f-93a1-587087452dd8",
          "amount": "250000.00",
          "currency": "IRT"
        },
        "rawResponse": {
          "provider": "MOCK",
          "referenceId": "MOCK-REF-54c0ef37-e142-4b2f-93a1-587087452dd8",
          "status": "SUCCESS",
          "paid": true
        },
        "createdAt": "2026-06-18T08:45:00.000Z",
        "updatedAt": "2026-06-18T08:45:00.000Z"
      }
    ],
    "createdAt": "2026-06-18T08:45:00.000Z",
    "updatedAt": "2026-06-18T08:45:00.000Z"
  },
  "enrollment": {
    "id": 1,
    "uuid": "7c93df3c-c2f0-4f7f-88d4-78a6fd2a3e41",
    "studentId": 1,
    "courseId": 1,
    "course": {
      "id": 1,
      "uuid": "17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec",
      "title": "NestJS Foundations",
      "description": "Build production-ready APIs with NestJS.",
      "thumbnailUrl": null,
      "price": "250000.00",
      "level": "BEGINNER",
      "status": "PUBLISHED",
      "teacherId": 2,
      "createdAt": "2026-06-18T08:45:00.000Z",
      "updatedAt": "2026-06-18T08:45:00.000Z"
    },
    "createdAt": "2026-06-18T08:45:00.000Z",
    "updatedAt": "2026-06-18T08:45:00.000Z"
  }
}
```

If the user is already enrolled, the backend returns:

```json
{
  "message": "User is already enrolled in this course",
  "alreadyEnrolled": true,
  "payment": null,
  "enrollment": {
    "id": 1,
    "uuid": "7c93df3c-c2f0-4f7f-88d4-78a6fd2a3e41",
    "studentId": 1,
    "courseId": 1,
    "course": {
      "id": 1,
      "uuid": "17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec",
      "title": "NestJS Foundations",
      "description": "Build production-ready APIs with NestJS.",
      "thumbnailUrl": null,
      "price": "250000.00",
      "level": "BEGINNER",
      "status": "PUBLISHED",
      "teacherId": 2,
      "createdAt": "2026-06-18T08:45:00.000Z",
      "updatedAt": "2026-06-18T08:45:00.000Z"
    },
    "createdAt": "2026-06-18T08:45:00.000Z",
    "updatedAt": "2026-06-18T08:45:00.000Z"
  }
}
```

When the user is already enrolled and has a previous payment request for that course, `payment` contains the latest matching payment request instead of `null`.

### My Payments

```http
GET /payments/me
```

Required permission:

```text
payments.read
```

Returns the current user's payment requests ordered by newest first. Each item includes the course and transactions.

Response: `PaymentRequest[]`

### Get Payment

```http
GET /payments/:id
```

`:id` is the payment request uuid.

Required permission:

```text
payments.read
```

Users can view their own payments. `ADMIN` and `SUPPORT` can view any payment.

Response: `PaymentRequest`

### Payment Request Shape

```json
{
  "id": 1,
  "uuid": "54c0ef37-e142-4b2f-93a1-587087452dd8",
  "userId": 1,
  "courseId": 1,
  "amount": "250000.00",
  "currency": "IRT",
  "status": "SUCCESS",
  "provider": "MOCK",
  "description": "Mock payment for course NestJS Foundations",
  "metadata": {
    "mode": "mock",
    "courseUuid": "17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec",
    "courseTitle": "NestJS Foundations"
  },
  "course": {
    "id": 1,
    "uuid": "17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec",
    "title": "NestJS Foundations",
    "description": "Build production-ready APIs with NestJS.",
    "thumbnailUrl": null,
    "price": "250000.00",
    "level": "BEGINNER",
    "status": "PUBLISHED",
    "teacherId": 2,
    "createdAt": "2026-06-18T08:45:00.000Z",
    "updatedAt": "2026-06-18T08:45:00.000Z"
  },
  "transactions": [
    {
      "id": 1,
      "uuid": "b91e4df2-e06f-495d-88f2-36287df9206f",
      "paymentRequestId": 1,
      "userId": 1,
      "courseId": 1,
      "amount": "250000.00",
      "currency": "IRT",
      "status": "SUCCESS",
      "provider": "MOCK",
      "providerAuthority": "MOCK-AUTH-54c0ef37-e142-4b2f-93a1-587087452dd8",
      "providerReferenceId": "MOCK-REF-54c0ef37-e142-4b2f-93a1-587087452dd8",
      "rawRequest": {
        "provider": "MOCK",
        "authority": "MOCK-AUTH-54c0ef37-e142-4b2f-93a1-587087452dd8",
        "amount": "250000.00",
        "currency": "IRT"
      },
      "rawResponse": {
        "provider": "MOCK",
        "referenceId": "MOCK-REF-54c0ef37-e142-4b2f-93a1-587087452dd8",
        "status": "SUCCESS",
        "paid": true
      },
      "createdAt": "2026-06-18T08:45:00.000Z",
      "updatedAt": "2026-06-18T08:45:00.000Z"
    }
  ],
  "createdAt": "2026-06-18T08:45:00.000Z",
  "updatedAt": "2026-06-18T08:45:00.000Z"
}
```

Allowed payment request `status` values:

```text
PENDING
SUCCESS
FAILED
CANCELED
```

Allowed payment transaction `status` values:

```text
SUCCESS
FAILED
```

Allowed `provider` values:

```text
MOCK
```

## Common Errors

Validation error:

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

Unauthorized:

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

Forbidden:

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

Not found:

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

## Seeded Roles And Permissions

Roles:

```text
ADMIN
TEACHER
STUDENT
SUPPORT
```

Permissions:

```text
users.read
users.create
users.update
users.delete
wallets.read
wallets.update
roles.read
roles.manage
permissions.read
permissions.manage
auth.me
admin.panel.access
teacher.panel.access
student.panel.access
support.panel.access
courses.read
courses.create
courses.update
courses.delete
videos.read
videos.create
videos.update
videos.delete
enrollments.read
enrollments.create
enrollments.delete
payments.read
payments.purchase
payments.manage
```

Default `STUDENT` permissions:

```text
student.panel.access
auth.me
courses.read
videos.read
enrollments.create
payments.purchase
payments.read
```

## Local Startup

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

`npm run start:dev` runs database prepare first:

```text
prisma generate -> prisma db push -> prisma db seed -> nest start --watch
```

PostgreSQL database must exist before startup. Prisma creates and updates the tables.

## Local API Test Data

To seed ready-to-test local users, courses, videos, enrollments, and mock payments:

```bash
cd backend
npm run db:seed:test-data
```

To run the local smoke test against a running backend:

```bash
npm run test:api:smoke
```

See `backend/docs/api-test-data.md` for demo account credentials, fixed UUIDs, and quick curl checks.
