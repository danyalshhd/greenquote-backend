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
   
   - Or locally:
     - `$ docker run -d --name redis-server -p 6379:6379 redis`
     - `docker run -d --name greenquote-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=greenquote -p 5432:5432 postgres:15
        `
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
- `npm run test:e2e`

## Trade-offs & next steps
- NestJS chosed for modularity and scalability in code as in express things get messy, 
  monorepo can be chosed but with larger teams it can become hard to manage.
  SQLite is not suitable for production grade apps. Primsa and Postgres provides
  higher typesafety as compared to MongoDB. Prisma have easier migrations and faster development
- I would add docker compose for dev and prod environment,
  add caching on monthly payment logic and also bull message queue for processing heavier tasks in parallel.
  add states and validation at Front End hence improving error handling at forms
  versioning to API
  add GraphQL
  setup CI for automated test running and linting
- I would setup using github actions and would check linting errors, unit tests, integration tests, build 
  backend and frontend, also check governance and compliance wherever necessary
- I would definitely go for cloud run as no need to manager servers and pay as you use, works with 
  other services of google like postgres
- I would mock data and test each scenario, do more of integration tests to cover all the flows.
  add more unit tests.
  For production readiness test coverage and monitoring alertness over email, database migration tests and rollbacks.
  check security like if the password is properly hashed, scalabilty tests to ensure scalability.
