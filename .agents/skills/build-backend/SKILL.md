---
name: build-backend
description: Scaffold and develop backend APIs using Node.js and Express (JavaScript) following a consistent layered architecture (routes, then controllers, then services, then repositories/models), with centralized error handling, validation, auth, and config. Use this skill whenever the user asks to start a new Node/Express backend project, add a new API endpoint or resource, set up database access, authentication, middleware, or error handling, or wants their backend code organized consistently — even if they don't explicitly say "architecture" or name this skill. Also use when reviewing or refactoring existing Node/Express code for structure/consistency.
---

# Node.js + Express Backend Dev

Scaffolds and extends backend APIs using a fixed, opinionated layered architecture: routes handle HTTP only, controllers orchestrate, services hold business logic, repositories/models handle data access. Centralized error handling, validation (Zod), and config.

Always follow this architecture unless the user explicitly asks for a different stack/pattern (e.g. NestJS, GraphQL, a different DB layer). Don't re-ask which pattern to use per task — these are fixed defaults.

## When to consult the reference file

Read `references/architecture.md` before doing any of the following, since it has the full folder layout, naming conventions, and code patterns:
- Scaffolding a brand-new backend project
- Adding a new resource/module (e.g. "users", "orders")
- Setting up database access, auth, middleware, or error handling
- Reviewing existing code for structural consistency

For a single trivial ask (e.g. "add a console.log here", "fix this typo"), you don't need the reference file — just do it.

## Workflow

### 1. New project scaffold
1. Read `references/architecture.md`.
2. `npm init -y`, then install: `express`, `dotenv`, `cors`, `helmet`, `morgan`, `zod`, `jsonwebtoken`, `bcryptjs`.
3. Install dev deps: `nodemon`, `jest`, `supertest`, `eslint`, `prettier`.
4. Build the folder skeleton exactly as in the reference file (`src/routes`, `src/controllers`, `src/services`, `src/repositories`, `src/models`, `src/middlewares`, `src/config`, `src/utils`, `src/validators`).
5. Set up `app.js` (Express app + middleware chain) separate from `server.js` (HTTP listener) — keeps app testable without starting a real server.
6. Wire up centralized error handler as the last middleware.
7. Add `.env.example`, `.gitignore`, and npm scripts (`dev`, `start`, `test`).

### 2. Adding a new resource/module
For a resource like "orders", create across the layers (see reference file section 2):
1. `routes/orders.routes.js` — defines endpoints, delegates to controller, no logic.
2. `controllers/orders.controller.js` — parses req, calls service, shapes response, calls `next(err)` on failure.
3. `services/orders.service.js` — business logic, orchestrates repositories, throws domain errors.
4. `repositories/orders.repository.js` — the only layer that talks to the database.
5. `validators/orders.validator.js` — Zod schemas for request body/params/query.
6. Register the route in `routes/index.js`.

Never let a controller call the database directly, and never put business logic in a route file.

### 3. Database access
- All DB queries live in `repositories/`. Controllers and services never import the DB client directly.
- Pick the DB layer based on what's already in the project; if new, ask the user Mongoose (MongoDB) vs Prisma (SQL) if not specified — see reference file section 3 for both patterns.

### 4. Auth & middleware
- JWT-based auth by default (`middlewares/auth.middleware.js`) unless the user specifies something else (sessions, OAuth provider, etc.).
- Global middleware order matters: `helmet` → `cors` → `express.json()` → `morgan` (logging) → routes → 404 handler → centralized error handler (see reference file section 4).

### 5. Validation & error handling
- Validate all incoming request bodies/params/query with Zod schemas in a `validators/` file, applied via a small `validate(schema)` middleware.
- All errors flow through `next(err)` to the centralized error handler — never `res.status().json()` an error directly inside a controller.
- Use a custom `AppError` class to distinguish operational errors (4xx, expected) from programming errors (5xx, bugs).

### 6. Reviewing existing code
Check against `references/architecture.md` for: layer violations (controller doing DB queries, route doing business logic), missing validation, errors handled ad-hoc instead of centrally, secrets read outside `config/`. Flag violations concretely (file + what to move/change).

## Output expectations

- Always produce real files via the file-creation tools, not just code in chat — this is a scaffolding/dev skill, the deliverable is working files.
- After scaffolding, briefly list what was created (tree view) rather than pasting every file's full contents into the chat.
- If the user's request conflicts with the architecture (e.g. asks to put DB calls in the controller), do what they ask but note the deviation from default.