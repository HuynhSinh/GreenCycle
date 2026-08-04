# GreenCycle

A home-based e-waste collection and recycling platform.

## Prerequisites

- Docker & Docker Compose
- Node.js v20 or later
- npm

## Environment Files

The project uses environment files in these locations:

- Backend: `server/.env`
- Frontend: `client/.env`

Default local database:

```env
DATABASE_URL=postgresql://greencycle:greencycle123@localhost:5433/greencycle?schema=public
```

Default local URLs:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

## Quick Start With Scripts

Run initial setup:

```bat
setup.bat
```

This will:

- Start PostgreSQL with Docker
- Install backend dependencies
- Run Prisma migrations
- Generate Prisma Client
- Optionally seed demo data
- Install frontend dependencies

Start the project:

```bat
start.bat
```

This will:

- Start PostgreSQL
- Run pending Prisma migrations
- Generate Prisma Client
- Open backend and frontend in separate terminals

## Manual Startup

Use this when you want to run each system separately.

### 1. Database

From the project root:

```bash
docker compose up -d
```

Check that PostgreSQL is available on `localhost:5433`.

### 2. Backend

Open a new terminal:

```bash
cd server
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Backend runs on:

```text
http://localhost:3000
```

### 3. Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## Seed Demo Data

Seed data is optional and resets demo tables.

```bash
cd server
npm run seed
```

Demo accounts are printed in the seed output.

## Useful Commands

Apply migrations:

```bash
cd server
npx prisma migrate deploy
```

Create/apply a new local migration during development:

```bash
cd server
npx prisma migrate dev
```

Regenerate Prisma Client:

```bash
cd server
npx prisma generate
```

Build frontend:

```bash
cd client
npm run build
```

## Notes

- Use Prisma migrations, not `prisma db push`, because this project has migration history.
- Run `npx prisma generate` after schema changes.
- If an old local database was created with `db push`, you may need to reset the database before using migrations.
- Keep Docker running while using the app.
