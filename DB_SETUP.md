# Local Postgres + Prisma Setup

## Why this does not interfere with other projects
- Uses dedicated compose project name: `ordermitnimo_local`
- Uses dedicated host port: `5439` (change in `.env` if needed)
- Uses dedicated docker volume: `ordermitnimo_pgdata`

## First-time setup
1. `npm install`
2. `npm run db:up`
3. `npx prisma migrate dev --name init`
4. `npm run prisma:seed`
5. `npm run prisma:studio`
6. `npm run dev:api`
7. In another terminal: `npm run dev`

## Useful commands
- Start DB: `npm run db:up`
- Stop DB: `npm run db:down`
- Follow DB logs: `npm run db:logs`
- Generate Prisma client: `npm run prisma:generate`
- Apply schema quickly (without migration file): `npm run prisma:push`
- Re-generate Prisma client after schema changes: `npm run prisma:generate`

## Connection
- `DATABASE_URL` is configured in `.env`
- Default local DB host port is `5439`
- API runs on `API_PORT` (default `4000`)

## Demo access users
- `owner@ordermitnimo.local` (sees all locations in tenant)
- `manager@ordermitnimo.local` (assigned to one location, manager role)
- `staff@ordermitnimo.local` (assigned to one location, viewer role)
- Password for all demo users: `demo1234`

Login endpoint:
- `POST /api/auth/login` with `{ "email": "...", "password": "demo1234" }`
- Session is stored in HttpOnly cookie and used for protected endpoints.
