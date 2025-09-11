# Cloover - GreenQuote Backend (NestJS + Prisma)

## Goals
Implements the GreenQuote pre-qualification API for Cloover coding challenge.

## Tech stack
- NestJS (TypeScript)
- Prisma + PostgreSQL
- JWT authentication
- Jest tests
- Docker 

## Setup (local)
1. Copy `.env.example` to `.env` and edit if needed.
2. Start DB + API:
   - With Docker Compose:
     ```
     docker-compose up --build
     ```
   - Or locally:
     - `npm ci`
     - set DATABASE_URL
     - `npx prisma migrate dev --name init`
     - `npx prisma db seed` (or `npm run prisma:seed`)
     - `npm run dev`

3. Seeded admin: `admin@test.com / Admin123!`

## Endpoints
- `POST /api/auth/register` { fullName, email, password }
- `POST /api/auth/login` { email, password } -> returns accessToken
- `POST /api/quotes` (protected) -> create a quote
- `GET /api/quotes` (protected) -> list user's quotes
- `GET /api/quotes/:id` (protected) -> get quote (owner or admin)
- `GET /api/quotes/admin/all?q=` (protected admin)
- `GET /api/health`

## Tests
- `npx ts-jest config:init`
- `npm test`

## Trade-offs & next steps
- Prisma chosen for developer speed and type-safety.
- JWT simple session approach; for production, add refresh tokens.
- Add rate limiting, request logging, Sentry.
- Add E2E tests (Playwright), OpenAPI docs.
- Add CI/CD pipeline for migrations, lint, tests, container build.
