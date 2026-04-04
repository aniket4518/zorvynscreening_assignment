# Finance Backend API Reference

This document describes the currently implemented API behavior in the codebase.

## Base URL

`/api`

## Run The Project

### Local Development

- Command: `pnpm run dev`
- Behavior: Generates Prisma client, pushes schema, runs seed, then starts API.
- Default URL: `http://localhost:3000`

### Docker (Single Command)

- Command: `docker compose up --build`
- File used: `docker-compose.yml`
- Optional host port override: `API_PORT=3002 docker compose up --build`
- Services started:
  - `db` (PostgreSQL)
  - `api` (backend service)
- API URL: `http://localhost:<API_PORT>` (default `3000`)

### Docker Stop

- Command: `docker compose down -v`

### Vercel Deployment (Budget-Friendly)

- This backend can run on Vercel using `vercel.json` and `api/index.ts`.
- Keep using a managed Postgres (Neon/Supabase) and set env vars in Vercel project settings.
- Required env vars:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
  - `NODE_ENV=production`
- Deploy command:
  - `vercel --prod`
- Important:
  - Run migrations separately before first production traffic (`npx prisma migrate deploy`).
  - Do not run `seed.ts` on every request in Vercel functions.

### Docker Troubleshooting

- Port `3000` already in use:
  - Stop the process using port `3000`, or change the API port mapping in `docker-compose.yml`.
- Port `5432` already in use:
  - Stop local PostgreSQL, or change the DB port mapping in `docker-compose.yml`.
- DB healthcheck timeout / API not starting:
  - Run `docker compose logs db` and `docker compose logs api` to inspect startup errors.
  - Retry with clean state: `docker compose down -v` then `docker compose up --build`.
- Prisma migration/seed errors in container:
  - Ensure `DATABASE_URL` in compose points to `db` service hostname.
  - Rebuild images after schema changes: `docker compose up --build`.

## Authentication

Protected routes require:

`Authorization: Bearer <JWT>`

Authentication failures return `401`.

## Rate Limits

- Global API: `100 requests/minute`
- Auth routes (`/api/auth/*`): `5 requests/minute`

## Common Response Formats

Success:

```json
{ "success": true, "data": {} }
```

Validation failure:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "formErrors": [],
    "fieldErrors": {}
  }
}
```

API error:

```json
{
  "success": false,
  "message": "...",
  "code": "BAD_REQUEST | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | INTERNAL_ERROR"
}
```

## 1) Health

### GET /api/health

- Access: Public
- Purpose: Server liveness check
- Success: `200`

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-04-04T10:20:30.000Z"
}
```

## 2) Auth Routes

### POST /api/auth/register

- Access: Public
- Body:
  - `email`: valid email
  - `name`: string (min 2, max 100)
  - `password`: min 8, must include uppercase, lowercase, number
- Purpose: Register user and return JWT
- Role assignment rule: If this is the first user in the system, role is `ADMIN`; otherwise role is `VIEWER`.
- Success: `201`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@finance.app",
      "name": "Admin",
      "role": "ADMIN",
      "status": "ACTIVE",
      "createdAt": "2026-04-04T10:20:30.000Z",
      "updatedAt": "2026-04-04T10:20:30.000Z"
    },
    "token": "<jwt>"
  }
}
```

Common errors:

- `400` validation failed
- `409` email already registered

### POST /api/auth/login

- Access: Public
- Body:
  - `email`: valid email
  - `password`: non-empty string
- Purpose: Login and return JWT
- Success: `200`
- Response shape: same as register

Common errors:

- `400` validation failed
- `401` invalid credentials
- `403` account inactive

### POST /api/auth/logout

- Access: Public
- Purpose: Stateless logout acknowledgement (client discards token)
- Success: `200`

```json
{ "success": true, "message": "Logged out successfully" }
```

## 3) User Routes

All `/api/users/*` routes require authentication.

### POST /api/users

- Access: `ADMIN`
- Body:
  - `email`: valid email
  - `name`: string (min 2, max 100)
  - `password`: min 8, must include uppercase, lowercase, number
  - `role`: optional `VIEWER | ANALYST | ADMIN` (default `VIEWER`)
  - `status`: optional `ACTIVE | INACTIVE` (default `ACTIVE`)
- Purpose: Create user as admin and write audit log
- Success: `201`

Common errors:

- `400` validation failed
- `409` email already registered

### GET /api/users/me

- Access: Any authenticated user
- Purpose: Current user profile
- Success: `200`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@mail.com",
    "name": "User",
    "role": "VIEWER",
    "status": "ACTIVE",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### GET /api/users?cursor=<id>&limit=20

- Access: `ADMIN`
- Query:
  - `cursor`: optional positive integer (last user id from previous response)
  - `limit`: int 1..100 (default 20)
- Purpose: List users (cursor paginated, newest first)
- Success: `200`

```json
{
  "success": true,
  "data": [],
  "meta": { "limit": 20, "nextCursor": 42 }
}
```

Notes:

- Response size defaults to 20 users.
- Call next page with `?cursor=<nextCursor>&limit=20`.
- `nextCursor: null` means no more data.

### GET /api/users/:id

- Access: `ADMIN`
- Params: `id` positive integer
- Purpose: Get user by id
- Success: `200`

Common errors:

- `400` invalid id param
- `404` user not found

### PATCH /api/users/:id

- Access: `ADMIN`
- Params: `id` positive integer
- Body: at least one of
  - `name` (min 2)
  - `email` (valid email)
- Purpose: Update user
- Success: `200`

Common errors:

- `400` validation failed
- `404` user not found
- `409` duplicate email

### DELETE /api/users/:id

- Access: `ADMIN`
- Params: `id` positive integer
- Purpose: Delete user. Admin accounts can only be self-deleted; admins cannot delete other admins.
- Success: `204` (no body)
- Errors:
  - `403` actor is `ADMIN` and target is a different `ADMIN`
  - `404` user not found

### PATCH /api/users/:id/role

- Access: `ADMIN`
- Params: `id` positive integer
- Body:
  - `role`: `VIEWER | ANALYST | ADMIN`
- Purpose: Assign role and write audit log
- Success: `200`

### PATCH /api/users/:id/status

- Access: `ADMIN`
- Params: `id` positive integer
- Purpose: Toggle `ACTIVE <-> INACTIVE` and write audit log
- Success: `200`

## 4) Financial Record Routes

All `/api/records/*` routes require authentication.

### POST /api/records

- Access: `ADMIN`
- Body:
  - `amount`: positive number
  - `type`: `INCOME | EXPENSE`
  - `categoryId`: positive integer
  - `date`: ISO datetime
  - `notes`: optional, max 500
- Purpose: Create a financial record
- Success: `201`

Common errors:

- `400` validation failed
- `400` invalid category id

### GET /api/records

- Access: `ANALYST | ADMIN`
- Query (all optional except pagination defaults):
  - `type`: `INCOME | EXPENSE`
  - `categoryId`: positive integer
  - `startDate`, `endDate`: ISO datetime
  - `search`: string (matches notes)
  - `cursor`: optional positive integer (last record id from previous response)
  - `limit`: int 1..100 (default 20)
- Purpose: List non-deleted records with filters (cursor paginated, newest first)
- Success: `200`

```json
{
  "success": true,
  "data": [],
  "meta": { "limit": 20, "nextCursor": 118 }
}
```

Notes:

- Response size defaults to 20 records.
- Call next page with `?cursor=<nextCursor>&limit=20` and keep the same filters.
- `nextCursor: null` means no more data.

### GET /api/records/:id

- Access: `ANALYST | ADMIN`
- Params: `id` positive integer
- Purpose: Get one non-deleted record
- Success: `200`

Common errors:

- `400` invalid id param
- `404` financial record not found

### PATCH /api/records/:id

- Access: `ADMIN`
- Params: `id` positive integer
- Body: any of `amount`, `type`, `categoryId`, `date`, `notes` (at least one required)
- Purpose: Update one record
- Success: `200`

### DELETE /api/records/:id

- Access: `ADMIN`
- Params: `id` positive integer
- Purpose: Soft delete record (`isDeleted = true`)
- Success: `204` (no body)

## 5) Dashboard Routes

All `/api/dashboard/*` routes require authentication.

### GET /api/dashboard/summary

- Access: `VIEWER | ANALYST | ADMIN`
- Query: `startDate`, `endDate` (optional ISO datetime)
- Purpose: Return `totalIncome`, `totalExpenses`, `netBalance`, `recordCount`
- Success: `200`

### GET /api/dashboard/categories

- Access: `VIEWER | ANALYST | ADMIN`
- Query:
  - `type`: optional `INCOME | EXPENSE`
  - `startDate`, `endDate`: optional ISO datetime
- Purpose: Category totals with percentage contribution
- Success: `200`

### GET /api/dashboard/trends

- Access: `ANALYST | ADMIN`
- Query:
  - `period`: `weekly | monthly` (default `monthly`)
  - `count`: number of periods (default `12`)
- Purpose: Time-series trend output per period
- Success: `200`

### GET /api/dashboard/recent

- Access: `VIEWER | ANALYST | ADMIN`
- Query:
  - `limit`: number (default `10`)
- Purpose: Most recent non-deleted records
- Success: `200`

## Permission Matrix

| Endpoint Group                                   | VIEWER | ANALYST | ADMIN |
| ------------------------------------------------ | ------ | ------- | ----- |
| `/api/users/me`                                  | Yes    | Yes     | Yes   |
| `/api/users/*` admin operations                  | No     | No      | Yes   |
| `GET /api/records*`                              | No     | Yes     | Yes   |
| Write `/api/records*`                            | No     | No      | Yes   |
| `/api/dashboard/summary` `/categories` `/recent` | Yes    | Yes     | Yes   |
| `/api/dashboard/trends`                          | No     | Yes     | Yes   |
