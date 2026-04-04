# --- Builder Stage ---
FROM node:24-alpine AS builder
WORKDIR /app

# Prisma config requires DATABASE_URL even for client generation.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# Copy manifest files first for better layer caching
COPY package*.json ./

# Install dependencies (includes dev dependencies for build and prisma cli)
RUN npm ci

# Copy rest of project
COPY . .

# Generate prisma client and build TypeScript
RUN npx prisma generate
RUN npm run build

# --- Runtime Stage ---
FROM node:24-alpine AS runner
WORKDIR /app

RUN apk add --no-cache dumb-init
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Copy runtime files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
EXPOSE 3000

USER nodejs

ENTRYPOINT ["dumb-init", "--"]
# Run DB migrations, seed defaults, then start API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seed.js && node dist/src/index.js"]
