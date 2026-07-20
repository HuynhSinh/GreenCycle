# Architecture Reference — Node.js + Express Backend

Full detail backing the SKILL.md workflow. Read the relevant section only.

## 1. Folder Structure

```
project-root/
├── src/
│   ├── app.js                      # Express app + middleware chain (no listen())
│   ├── server.js                   # Imports app, calls app.listen()
│   ├── config/
│   │   ├── index.js                # Loads & validates env vars
│   │   └── db.js                   # DB connection setup
│   ├── routes/
│   │   ├── index.js                # Mounts all resource routers
│   │   └── orders.routes.js
│   ├── controllers/
│   │   └── orders.controller.js
│   ├── services/
│   │   └── orders.service.js
│   ├── repositories/
│   │   └── orders.repository.js
│   ├── models/                     # ORM/ODM schema definitions
│   │   └── order.model.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── validate.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   └── notFound.middleware.js
│   ├── validators/
│   │   └── orders.validator.js     # Zod schemas
│   ├── utils/
│   │   ├── AppError.js
│   │   └── asyncHandler.js
│   └── errors/
│       └── AppError.js
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── .eslintrc.json
├── .gitignore
└── package.json
```

### Layer responsibilities

| Layer | Responsibility | Must NOT do |
|---|---|---|
| **routes** | Map HTTP verb+path to controller, apply middleware (auth, validation) | Contain any logic |
| **controllers** | Parse `req`, call service, shape `res`, forward errors via `next(err)` | Talk to DB, contain business rules |
| **services** | Business logic, orchestrate one or more repositories, throw domain errors | Know about `req`/`res`, know about SQL/Mongo syntax directly |
| **repositories** | All DB queries/mutations for one resource | Contain business logic, validation |
| **models** | Schema/shape definitions (Mongoose schema, Prisma model, etc.) | — |

## 2. Adding a Resource — Full Example ("orders")

**routes/orders.routes.js**
```js
const router = require('express').Router();
const controller = require('../controllers/orders.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createOrderSchema } = require('../validators/orders.validator');
const { requireAuth } = require('../middlewares/auth.middleware');

router.get('/', requireAuth, controller.list);
router.post('/', requireAuth, validate(createOrderSchema), controller.create);
router.get('/:id', requireAuth, controller.getById);

module.exports = router;
```

**controllers/orders.controller.js**
```js
const ordersService = require('../services/orders.service');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const orders = await ordersService.listOrdersForUser(req.user.id);
  res.json({ data: orders });
});

exports.create = asyncHandler(async (req, res) => {
  const order = await ordersService.createOrder(req.user.id, req.body);
  res.status(201).json({ data: order });
});
```

**services/orders.service.js**
```js
const ordersRepository = require('../repositories/orders.repository');
const AppError = require('../utils/AppError');

exports.listOrdersForUser = (userId) => ordersRepository.findByUserId(userId);

exports.createOrder = async (userId, payload) => {
  if (payload.items.length === 0) {
    throw new AppError('Order must have at least one item', 400);
  }
  return ordersRepository.create({ ...payload, userId });
};
```

**repositories/orders.repository.js** (Mongoose example)
```js
const Order = require('../models/order.model');

exports.findByUserId = (userId) => Order.find({ userId }).lean();
exports.create = (data) => Order.create(data);
```

**validators/orders.validator.js**
```js
const { z } = require('zod');

exports.createOrderSchema = z.object({
  body: z.object({
    items: z.array(z.object({ sku: z.string(), qty: z.number().positive() })).min(1),
  }),
});
```

## 3. Database Access Patterns

### Mongoose (MongoDB)
```js
// config/db.js
const mongoose = require('mongoose');

exports.connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
};
```
```js
// models/order.model.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ sku: String, qty: Number }],
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
```

### Prisma (SQL)
```js
// config/db.js
const { PrismaClient } = require('@prisma/client');
exports.prisma = new PrismaClient();
```
```js
// repositories/orders.repository.js
const { prisma } = require('../config/db');

exports.findByUserId = (userId) => prisma.order.findMany({ where: { userId } });
exports.create = (data) => prisma.order.create({ data });
```

Choose based on what's already in the project. If starting fresh and the user hasn't specified, ask: MongoDB/Mongoose (flexible schema, fast to start) vs PostgreSQL/Prisma (relational, type-safe, better for complex joins).

## 4. Middleware Chain (app.js)

Order matters — security/parsing first, routes in the middle, error handling last.

```js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const notFound = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
```

```js
// server.js
require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
```

## 5. Error Handling

```js
// utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // expected error, safe to show message to client
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
```

```js
// utils/asyncHandler.js — wraps async controllers so thrown errors reach next()
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
```

```js
// middlewares/errorHandler.middleware.js
module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (!err.isOperational) console.error(err); // log unexpected errors

  res.status(statusCode).json({ error: message });
};
```

```js
// middlewares/notFound.middleware.js
module.exports = (req, res) => res.status(404).json({ error: 'Route not found' });
```

## 6. Auth Middleware (JWT)

```js
// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

exports.requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next(new AppError('Missing token', 401));

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};
```

## 7. Validation Middleware

```js
// middlewares/validate.middleware.js
exports.validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }
  next();
};
```

## 8. Config

```js
// config/index.js
require('dotenv').config();

const required = ['PORT', 'JWT_SECRET', 'MONGO_URI'];
required.forEach((key) => {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
});

module.exports = {
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  mongoUri: process.env.MONGO_URI,
  nodeEnv: process.env.NODE_ENV || 'development',
};
```

Never read `process.env.*` directly outside `config/` — always import from the config module so all env access is in one auditable place.

## 9. Testing

- **Unit tests** (`tests/unit/`): test services/utils in isolation, mock repositories.
- **Integration tests** (`tests/integration/`): use `supertest` against the exported `app` (not `server.js`, since that starts a real listener).

```js
// tests/integration/orders.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/orders', () => {
  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });
});
```

## 10. Review Checklist (for existing codebases)

When reviewing code against this architecture, check:
- [ ] Controllers don't contain DB queries or business rules
- [ ] Routes contain no logic, only wiring (middleware + controller)
- [ ] All DB access goes through `repositories/`
- [ ] All request input validated via a `validators/` schema before reaching the controller
- [ ] Errors thrown/passed via `next(err)`, never `res.status().json()`'d ad-hoc inside try/catch blocks scattered around
- [ ] Secrets/env vars only read inside `config/`, not scattered via `process.env` calls
- [ ] `app.js` (app definition) is separate from `server.js` (listener), so tests can import `app` without starting a real server