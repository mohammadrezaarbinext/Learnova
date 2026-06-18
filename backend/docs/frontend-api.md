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

The backend stores JWT session metadata in Redis. If the Redis session expires or is removed, the JWT is rejected.

OTP is currently mocked. The backend logs it in the terminal:

```text
LearnNova OTP [REGISTER] for +989121234567: 123456
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
  "roles": ["STUDENT"],
  "permissions": ["student.panel.access", "auth.me"],
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
    "permissions": ["student.panel.access", "auth.me"],
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
    "permissions": ["student.panel.access", "auth.me"],
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

Response: user object.

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
```

Default `STUDENT` permissions:

```text
student.panel.access
auth.me
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
