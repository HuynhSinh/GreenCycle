# GreenCycle

A home-based e-waste collection and recycling platform.

---

# Prerequisites

Before running the project, make sure you have installed:

- Docker & Docker Compose
- Node.js (v20 or later recommended)
- npm

---

# Getting Started

## 1. Start the Database

From the project root directory, start the PostgreSQL database using Docker:

```bash
docker compose up
```

> Keep this terminal running while using the application.

---

## 2. Run the Backend

Open a new terminal and navigate to the backend directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Push the Prisma schema to the database:

```bash
npx prisma db push
```

Generate the Prisma Client:

```bash
npx prisma generate
```

Start the development server:

```bash
npm run dev
```

---

## 3. Run the Frontend

Open another terminal and navigate to the frontend directory:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

# Project Startup Order

Run the project in the following order:

### 1. Start the database

```bash
docker compose up
```

### 2. Start the backend

```bash
cd server

npm install

npx prisma db push

npx prisma generate

npm run dev
```

### 3. Start the frontend

```bash
cd client

npm install

npm run dev
```

---

# Notes

- Ensure the database container is running before starting the backend.
- `npx prisma db push` only needs to be run the first time or whenever the Prisma schema changes.
- `npx prisma generate` should be run after any changes to the Prisma schema.
- Make sure the `.env` files for both the `server` and `client` are configured correctly before running the application.