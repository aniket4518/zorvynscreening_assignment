# Finance Backend API

A modern financial record management backend built with Express, TypeScript, Prisma, and PostgreSQL. Includes role-based access control, JWT authentication, audit logging, and dashboard analytics.

## Features

- ✅ **JWT Authentication** — Secure token-based auth with configurable expiry
- ✅ **Role-Based Access Control** — VIEWER, ANALYST, ADMIN roles with fine-grained permissions
- ✅ **Financial Records** — Track income and expense transactions with categories
- ✅ **Dashboard Analytics** — Summary, category totals, trends, and recent activity
- ✅ **Audit Logging** — Track all user actions for compliance
- ✅ **Rate Limiting** — Global and auth-specific rate limits
- ✅ **Input Validation** — Zod schemas with automatic request sanitization
- ✅ **Soft Deletes** — Non-destructive record removal
- ✅ **Cursor Pagination** — Efficient list navigation
- ✅ **Docker Support** — Single-command local environment setup
- ✅ **Vercel Ready** — Serverless function deployment

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Language**: TypeScript 5.7
- **Framework**: Express 5.1
- **Database**: PostgreSQL with Prisma ORM 7.0
- **Authentication**: JWT with bcryptjs
- **Validation**: Zod
- **Deployment**: Vercel Serverless, Docker Compose

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- PostgreSQL database (or Neon/Supabase)

### Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# Seed database (optional)
npm run seed

# Start dev server
npm run dev
```

Server runs on `http://localhost:3000` by default.

### Docker (All-in-One)

```bash
# Start both PostgreSQL and API
docker compose up --build

# Stop services and clean up
docker compose down -v
```

Default DB credentials: `postgres:password` on `localhost:5432`.

### Production Build

```bash
npm run build
npm start
```

## Environment Variables

Create `.env` in the root directory:

```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
```

**Required**: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Set project root to `financial-backend`
3. Configure environment variables in project settings:
   - `DATABASE_URL` (from Neon/Supabase)
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `NODE_ENV=production`

4. Install command: `npm install --include=dev`
5. Build command: `npm run build`
6. Leave Start Command empty (Vercel auto-configures serverless)

Visit: `https://your-project.vercel.app/api/health` to verify deployment.

### Docker Production

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your-secret" \
  -e JWT_EXPIRES_IN="7d" \
  -e NODE_ENV="production" \
  your-image:latest
```

## API Documentation

Full API reference available in [API.md](./API.md).

### Public Endpoints

- `GET /` — Server status (for health checks)
- `GET /api/health` — Detailed health check
- `POST /api/auth/register` — Create new user
- `POST /api/auth/login` — Get JWT token
- `POST /api/auth/logout` — Logout acknowledgement

### Protected Endpoints (Require JWT)

#### Users

- `GET /api/users/me` — Current user profile (any role)
- `POST /api/users` — Create user (ADMIN only)
- `GET /api/users` — List users (ADMIN only, paginated)
- `GET /api/users/:id` — Get user by ID (ADMIN only)
- `PATCH /api/users/:id` — Update user (ADMIN only)
- `DELETE /api/users/:id` — Delete user (ADMIN only)
- `PATCH /api/users/:id/role` — Assign role (ADMIN only)
- `PATCH /api/users/:id/status` — Toggle active/inactive (ADMIN only)

#### Financial Records

- `POST /api/records` — Create record (ADMIN only)
- `GET /api/records` — List records with filters (ANALYST, ADMIN)
- `GET /api/records/:id` — Get record (ANALYST, ADMIN)
- `PATCH /api/records/:id` — Update record (ADMIN only)
- `DELETE /api/records/:id` — Soft delete record (ADMIN only)

#### Dashboard

- `GET /api/dashboard/summary` — Income/expense summary (any role)
- `GET /api/dashboard/categories` — Category breakdown (any role)
- `GET /api/dashboard/trends` — Time-series trends (ANALYST, ADMIN)
- `GET /api/dashboard/recent` — Recent activity (any role)

## Rate Limits

- **Global API**: 100 requests/minute
- **Auth routes**: 5 requests/minute

## Database Migrations

### Create a New Migration

```bash
npx prisma migrate dev --name your_migration_name
```

### Apply Migrations (Production)

```bash
npx prisma migrate deploy
```

### View Migration History

```bash
npx prisma migrate status
```

## Seed Database

Run pre-configured seed data:

```bash
npm run seed
```

Seeds:

- ✅ Default categories (Income: Salary, Freelance, Investment; Expense: Food, Transport, Housing, etc.)
- ✅ Admin user (email: `admin@finance.app`, password: `admin123`)

## Project Structure

```
financial-backend/
├── api/                    # Vercel serverless entry
│   └── index.ts           # Express app export
├── src/
│   ├── app.ts             # Express configuration
│   ├── index.ts           # Local server entry
│   ├── config/            # Database & config setup
│   ├── controller/        # Route handlers
│   ├── middleware/        # Express middleware
│   ├── routes/            # Route definitions
│   ├── services/          # Business logic
│   ├── utils/             # Helpers (JWT, password, errors)
│   └── zod/               # Request validation schemas
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Seed script
│   └── migrations/        # Migration history
├── generated/             # Auto-generated Prisma types
├── dist/                  # Compiled JavaScript
├── docker-compose.yml     # Local Docker setup
├── Dockerfile             # Docker image definition
├── vercel.json            # Vercel route config
├── tsconfig.json          # TypeScript config
└── package.json           # Dependencies & scripts
```

## Scripts

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript
npm start                # Run compiled server
npm run seed             # Seed database with initial data
npm run docker:up        # Start Docker Compose
npm run docker:down      # Stop Docker Compose and clean volumes
```

## Testing

### Register and Login

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "Secure123"
  }'
```

Response includes `token` (JWT for future requests).

### Use JWT Token

```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### Build fails with "Cannot find module .../generated/prisma/client.js"

**Solution**: Run `npm run build` instead of `tsc` directly. The prebuild script ensures Prisma client is generated first.

### "Port 3000 already in use"

**Solution**: Change port in `.env` or stop the process using it.

### Database connection refused

**Solution**:

- Verify `DATABASE_URL` is correct
- For local Docker: wait 5-10s for PostgreSQL to start, or check `docker compose logs db`
- For production: verify database is running and network rules allow connection

### Prisma client out of sync

**Solution**: Regenerate the client after schema changes:

```bash
npx prisma generate
```

## Security Notes

- ⚠️ Always use **HTTPS in production** (Vercel handles this automatically)
- ⚠️ Rotate `JWT_SECRET` regularly and never commit to version control
- ⚠️ Use strong, unique database passwords (not `password`)
- ⚠️ Keep dependencies up-to-date: `npm audit fix`
- ⚠️ Sensitive `.env` is ignored by Git; never commit it

## License

See [LICENSE](./LICENSE) file.

## Author

Aniket Jha

## Support

For issues or questions, refer to [API.md](./API.md) for detailed endpoint documentation or open an issue in the repository.
