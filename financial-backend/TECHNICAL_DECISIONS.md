# Technical Decisions & Trade-offs

This document outlines the architectural and technology choices made for the Finance Backend API, along with the reasoning and trade-offs for each decision.

---

## 1. Framework: Express.js 5.1

**Decision**: Use Express as the HTTP framework.

**Why**:

- Minimal and unopinionated — gives fine-grained control over middleware, routing, and error handling
- Industry standard with vast ecosystem of compatible middleware
- Lightweight and performant for financial APIs
- Easy to deploy to Vercel as serverless function
- Great for both monoliths and modular architectures

**Trade-offs**:

- ✅ **Pro**: Flexible, battle-tested, easy to integrate Prisma/auth/validation
- ❌ **Con**: Requires manual setup for logging, error handling, request/response standardization (mitigated with custom middleware)

**Alternatives Considered**:

- Fastify: Faster, but overkill for this API scale; less middleware ecosystem
- NestJS: Great structure, but heavier opinionated framework; slower iteration
- Hono: Lightweight, but smaller ecosystem and less mature

---

## 2. Language: TypeScript 5.7

**Decision**: Fully typed codebase with strict mode enabled.

**Why**:

- Catches type errors at compile time, reducing runtime bugs in financial calculations
- Self-documenting code — parameters and return types are explicit
- IDE autocompletion improves developer experience
- Critical for financial data integrity and security

**Trade-offs**:

- ✅ **Pro**: Type safety, better refactoring, fewer production bugs
- ❌ **Con**: Build step required; slightly slower development iteration; requires tsconfig expertise

**Config Highlights**:

```json
{
  "strict": true,
  "verbatimModuleSyntax": true,
  "module": "NodeNext"
}
```

---

## 3. Database ORM: Prisma 7.0

**Decision**: Use Prisma as the ORM and schema manager.

**Why**:

- **Type-safe queries**: Auto-generated types for every model
- **Zero N+1 queries**: Explicit `include`/`select` forces thinking about data fetching
- **Built-in migrations**: `prisma migrate` handles schema versioning
- **Seed support**: Native `seed.ts` integration for test data
- **PostgreSQL adapter**: Direct Postgres driver eliminates extra connection layer

**Trade-offs**:

- ✅ **Pro**: Types, migrations, clean queries, fast development
- ❌ **Con**: Less flexible than raw SQL; generated code bloat; slight performance overhead on very complex nested queries

**Example Trade-off in Code**:

```typescript
// Prisma (safe, explicit, but must manually aggregate)
const grouped = await prisma.financialRecord.groupBy({
  by: ["categoryId"],
  _sum: { amount: true },
});

// Raw SQL (might be faster for complex aggregates, but no type safety)
// const grouped = await db.query(`SELECT categoryId, SUM(amount) FROM financial_records GROUP BY categoryId`);
```

---

## 4. Database: PostgreSQL

**Decision**: Use PostgreSQL as primary database.

**Why**:

- ACID transactions guarantee financial data consistency
- Robust aggregation functions (SUM, GROUP BY, window functions)
- Excellent for time-series analytics (dashboard trends)
- JSON support for flexible audit logs
- Managed options (Neon, Supabase) for serverless
- Open-source and widely available

**Trade-offs**:

- ✅ **Pro**: Reliability, rich features, scalable
- ❌ **Con**: Heavier than SQLite; requires external hosting cost

**Alternatives Considered**:

- SQLite: Great for dev/testing, but not suitable for production multi-user API
- MongoDB: Flexible schema, but ACID transactions less reliable; harder financial auditing
- MySQL: Similar to Postgres, but Postgres has better JSON and Window functions

---

## 5. Authentication: JWT (JSON Web Tokens)

**Decision**: Stateless JWT tokens for API authentication.

**Why**:

- **Serverless-friendly**: No session store needed on Vercel
- **Scalable**: Tokens are self-contained; no database lookup per request
- **Standard**: JWT is industry standard for APIs
- **Role information embedded**: Reduces need for role lookups

**Trade-offs**:

- ✅ **Pro**: Stateless, scalable, standard
- ❌ **Con**: Cannot revoke tokens mid-lifetime (workaround: blacklist DB or short expiry)
- ❌ **Con**: Token size increases with payload (mitigated with minimal claims)

**Implementation**:

```typescript
// Token payload
{
  userId: number,
  role: "VIEWER" | "ANALYST" | "ADMIN",
  iat: timestamp,
  exp: timestamp + 7d
}
```

**Future Consideration**:

- If token revocation becomes critical, implement Redis blacklist cache

---

## 6. Password Hashing: bcryptjs

**Decision**: Use bcryptjs with salt rounds = 10.

**Why**:

- Industry standard for password hashing
- Slow hashing prevents brute-force attacks (computational cost)
- Pure JavaScript implementation works in any environment
- Battle-tested security library

**Trade-offs**:

- ✅ **Pro**: Secure by design, slow enough to deter brute force
- ❌ **Con**: Slower than argon2 (trade security for speed value judgment)
- ❌ **Con**: Not GPU-resistant (argon2 is)

**Config**:

```typescript
const hashedPassword = await bcrypt.hash(password, 10); // 10 rounds
```

---

## 7. Request Validation: Zod

**Decision**: Use Zod schemas for runtime validation.

**Why**:

- **Type inference**: Automatically generate TypeScript types from schemas
- **Runtime safety**: Catches malformed requests before business logic
- **Clear error messages**: Non-technical users understand validation failures
- **Compose-able**: Reuse schemas across endpoints easy
- **Lightweight**: No dependencies beyond TypeScript

**Trade-offs**:

- ✅ **Pro**: Type-safe, great DX, clear responses
- ❌ **Con**: Small runtime validation overhead (negligible for API scale)
- ❌ **Con**: Schema duplication if used in frontend

**Example**:

```typescript
const recordSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.number().int().positive(),
});

// Automatically infer: type Record = z.infer<typeof recordSchema>
```

---

## 8. Module System: ESM (ECMAScript Modules)

**Decision**: Use ESM with `"type": "module"` and `verbatimModuleSyntax`.

**Why**:

- **Modern standard**: ESM is the future of JavaScript
- **Static analysis**: Enables better tree-shaking and bundling
- **Vercel native**: Serverless platforms prefer ESM
- **Explicit imports**: Clarity on dependencies

**Trade-offs**:

- ✅ **Pro**: Future-proof, better tooling support
- ❌ **Con**: Requires explicit `.js` extensions in imports
- ❌ **Con**: Slightly harder to debug CommonJS package compatibility

**Example**:

```typescript
import prisma from "../config/prisma.js"; // .js extension required
import type { User, Role } from "../../generated/prisma/client.js";
```

---

## 9. Deployment: Vercel Serverless

**Decision**: Deploy API as Vercel serverless functions.

**Why**:

- **Cost-effective**: Scales to zero cost when idle
- **Global CDN**: Auto-distributed for low latency
- **Zero ops**: No container/server management
- **GitHub integration**: Push → deploy automation
- **Environment variables**: Secure secret management

**Trade-offs**:

- ✅ **Pro**: Low cost, global, automatic scaling
- ❌ **Con**: 60-second request timeout limit (OK for API, not batch jobs)
- ❌ **Con**: Cold starts add 1-2 seconds first request (mitigated with warmup)
- ❌ **Con**: Stateless only (no in-memory caching across endpoints)

**Implementation**:

```json
{
  "version": 2,
  "builds": [{ "src": "api/index.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "api/index.ts" }]
}
```

---

## 10. Docker: Multi-stage Build

**Decision**: Use multi-stage Dockerfile for lean production image.

**Why**:

- **Builder stage**: Compile TypeScript, install dev dependencies
- **Runner stage**: Copy only production code and node_modules
- **Small image**: ~150MB vs 700MB+ monolithic approach
- **No source code**: Production image excludes .ts files, .env, etc.

**Trade-offs**:

- ✅ **Pro**: Secure, fast transfers, reduced attack surface
- ❌ **Con**: Build time slower than single-stage (~40s vs 20s)
- ❌ **Con**: More complex Dockerfile

**Multi-stage Flow**:

```dockerfile
FROM node:24-alpine AS builder
# Install, build, generate

FROM node:24-alpine AS runner
# Copy only dist/, node_modules, prisma/
# (no source code, no devDependencies)
```

---

## 11. Rate Limiting: express-rate-limit

**Decision**: In-memory rate limiting at middleware level.

**Why**:

- **Simple**: No external cache dependency needed
- **Fast**: Sub-millisecond checks
- **Sufficient**: Works well for single-server or Vercel scale

**Trade-offs**:

- ✅ **Pro**: No Redis overhead, simple
- ❌ **Con**: Per-instance limits (doesn't sync across load-balanced servers)
- ❌ **Con**: Resets on restart (no persistence)

**Thresholds**:

```typescript
globalLimiter: 100 requests/minute
authLimiter: 5 requests/minute (on /api/auth/*)
```

**Future**: If global limits across instances needed, integrate Redis.

---

## 12. Error Handling: Custom Error Class

**Decision**: Centralized `ApiError` class for all error responses.

**Why**:

- **Consistent format**: Every error response has same shape
- **Type safety**: Error codes are enumerated
- **Middleware capture**: Express error middleware catches all
- **Client clarity**: Non-technical clients understand error structure

**Trade-offs**:

- ✅ **Pro**: Predictable API contracts, easier debugging
- ❌ **Con**: All routes must use ApiError (discipline required)

**Example**:

```typescript
// Standard response
{ success: false, message: "...", code: "UNAUTHORIZED" }

// With validation errors
{ success: false, message: "Validation failed", errors: { fieldErrors: {} }}
```

---

## 13. Logging: Console-based (Minimal)

**Decision**: Use `console.log/error` for now; Prisma logs only errors in production.

**Why**:

- **Vercel native**: Logs appear in project dashboard
- **Simple**: No third-party logging service overhead
- **Sufficient**: For current scale and debugging needs

**Trade-offs**:

- ✅ **Pro**: Zero dependencies, instant setup
- ❌ **Con**: No structured logging, no trace IDs across requests
- ❌ **Con**: Hard to search/filter logs at scale

**Future**: Integrate `winston` or `pino` for structured logging if needed.

---

## 14. Pagination: Cursor-based

**Decision**: Cursor pagination (not offset-based) for list endpoints.

**Why**:

- **Stable**: Handles concurrent inserts/deletes gracefully
- **Efficient**: Index-based queries scale better than offset
- **No duplicates**: Cursor-based never skips or repeats rows

**Trade-offs**:

- ✅ **Pro**: Scales, handles mutations, no N+1
- ❌ **Con**: Cannot jump to page 42 (must iterate)
- ❌ **Con**: Slightly more complex API contract

**Implementation**:

```typescript
// Request: ?cursor=42&limit=20
// Response: { data: [...], meta: { cursor, nextCursor } }
```

---

## 15. Soft Deletes vs Hard Deletes

**Decision**: Use soft deletes (`isDeleted` flag) for financial records.

**Why**:

- **Auditing**: Deleted records remain in DB for compliance
- **Recovery**: Mistakes can be undone
- **Analytics**: Historical accuracy (trends won't change retroactively)
- **Financial law**: Many jurisdictions require 7-year record retention

**Trade-offs**:

- ✅ **Pro**: Audit trail, recovery, compliance
- ❌ **Con**: Extra indexes needed, slightly slower queries
- ❌ **Con**: Requires discipline (`WHERE isDeleted = false` everywhere)

---

## 16. Audit Logging: Structured JSON

**Decision**: Store audit logs with action, entity, details as JSON.

**Why**:

- **Flexible schema**: Can log heterogeneous actions
- **Queryable**: JSON can be searched (e.g., `details->>'previousRole'`)
- **Compact**: JSON more space-efficient than normalized tables

**Trade-offs**:

- ✅ **Pro**: Flexible, queryable, compact
- ❌ **Con**: Less structured; requires JSON parsing in queries
- ❌ **Con**: No schema validation on details field

**Example**:

```typescript
{
  userId: 1,
  action: "UPDATE_ROLE",
  entity: "User",
  entityId: 5,
  details: JSON.stringify({ previousRole: "VIEWER", newRole: "ANALYST" })
}
```

---

## 17. Role-Based Access Control (RBAC): Hardcoded Middleware

**Decision**: Define roles and permissions in code, not database.

**Why**:

- **Fast**: No DB lookup per request
- **Auditable**: Code review for permission changes
- **Simple**: For small set of roles (VIEWER, ANALYST, ADMIN)

**Trade-offs**:

- ✅ **Pro**: Fast, auditable, simple
- ❌ **Con**: Requires code deploy to change permissions
- ❌ **Con**: Cannot support dynamic role creation

**Future**: If custom roles needed, migrate to DB-backed RBAC with caching.

---

## 18. Environment: Separate .env Commit Strategy

**Decision**: Commit `.env.example` with dummy values; `.env` ignored in `.gitignore`.

**Why**:

- **Security**: Real secrets never in Git
- **Onboarding**: Developers see required variables
- **Flexibility**: Each developer/environment has own secrets

**Trade-offs**:

- ✅ **Pro**: Secure, clear setup
- ❌ **Con**: Manual setup step for new developers
- ❌ **Con**: Easy to forget syncing .env.example when adding new vars

---

## 19. Testing: No Unit Tests (Trade-off)

**Decision**: Currently no unit test suite; rely on manual/integration testing.

**Why** (Current state):

- Time constraint; focus on MVP feature completeness
- API is mostly database queries (tested via integration anyway)

**Future Recommendation**:
Add Jest with:

- Service layer unit tests (aggregations, filtering logic)
- Controller middleware tests (RBAC, validation)
- Integration tests (full request/response flows)

**Example future test**:

```typescript
describe("getDashboardSummary", () => {
  it("should return correct totals for date range", async () => {
    // arrange: seed test data
    // act: call service
    // assert: verify calculations
  });
});
```

---

## 20. Monitoring & Observability: None (Future)

**Decision**: No APM, tracing, or custom metrics yet.

**Why**:

- Vercel provides basic monitoring dashboard
- Small user base; issues are visible immediately
- Focus on feature delivery

**Future When Needed**:

- **APM**: Sentry for error tracking
- **Metrics**: Prometheus + Grafana for dashboards
- **Tracing**: OpenTelemetry for request flows
- **Logging**: Structured logging to centralized sink (DataDog, CloudWatch)

---

## Summary Table

| Layer          | Choice            | Why                     | Trade-off                   |
| -------------- | ----------------- | ----------------------- | --------------------------- |
| **HTTP**       | Express 5.1       | Lightweight, flexible   | Manual setup                |
| **Language**   | TypeScript        | Type safety             | Build step                  |
| **ORM**        | Prisma 7          | Type-safe, migrations   | Less flexible than raw SQL  |
| **Database**   | PostgreSQL        | Reliable, rich features | Managed cost                |
| **Auth**       | JWT               | Stateless, scalable     | No mid-lifetime revocation  |
| **Hashing**    | bcryptjs          | Secure                  | Slow (by design)            |
| **Validation** | Zod               | Type inference          | Runtime overhead            |
| **Modules**    | ESM               | Modern, future-proof    | Explicit .js extensions     |
| **Deployment** | Vercel Serverless | Low cost, global        | 60s timeout, cold starts    |
| **Docker**     | Multi-stage       | Lean, secure image      | Slower builds               |
| **Rate Limit** | In-memory         | Simple                  | Per-instance limits         |
| **Errors**     | Custom class      | Consistent              | Discipline required         |
| **Pagination** | Cursor-based      | Scales                  | Cannot jump pages           |
| **Deletes**    | Soft deletes      | Audit trail             | Extra indexes               |
| **RBAC**       | Hardcoded         | Fast                    | Requires deploy for changes |

---

## Potential Future Improvements

1. **Caching**: Add Redis for session tokens, rate limit state, and dashboard calculations
2. **Batch Operations**: Support bulk create/update to handle large financial imports
3. **Webhooks**: Emit events for high-value transactions (compliance integration)
4. **Multi-tenancy**: Partition data by organization with same schema
5. **GraphQL**: Add if frontend needs complex nested queries
6. **Event Sourcing**: Optional; maintain immutable transaction log for complete audit
7. **Search**: Add Elasticsearch if complex financial search needed
8. **Reporting**: Scheduled Postgres reports exported to S3/email

---

## Conclusion

This architecture prioritizes **simplicity, type safety, and serverless scalability** over premature optimization. The stack is suitable for MVP to mid-scale financial apps (1K-100K transactions/day). Decisions can be revisited and optimized as the product evolves and usage patterns become clear.
