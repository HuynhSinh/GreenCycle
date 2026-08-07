# Kiến trúc backend hiện tại

## 1. Tổng quan

Backend của GreenCycle hiện đang dùng kiến trúc layered architecture trên Node.js và Express.

Stack chính:

- Node.js
- Express
- Prisma
- PostgreSQL
- Zod
- JWT
- Cookie-based authentication
- Jest và Supertest
- Helmet, CORS, Morgan, cookie-parser
- Express rate limit

Mục tiêu của kiến trúc này là tách rõ từng trách nhiệm trong backend: route chỉ định nghĩa endpoint, controller xử lý HTTP, service chứa nghiệp vụ, repository truy cập database.

## 2. Cấu trúc thư mục chính

```txt
server/
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   └── migrations/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── validators/
└── tests/
    ├── integration/
    └── unit/
```

## 3. Kiểu kiến trúc đang sử dụng

### Layered architecture

Backend đang chia theo layer kỹ thuật:

```txt
routes
→ controllers
→ services
→ repositories
→ database
```

Trách nhiệm từng layer:

| Layer | Trách nhiệm |
|---|---|
| `routes/` | Khai báo endpoint, HTTP method, middleware auth/validation/rate limit |
| `controllers/` | Nhận request đã validate, gọi service, trả response |
| `services/` | Chứa business logic, kiểm tra điều kiện nghiệp vụ, điều phối nhiều repository |
| `repositories/` | Chứa Prisma query, là nơi truy cập database trực tiếp |
| `validators/` | Chứa Zod schema để validate request |
| `middlewares/` | Auth, validation, rate limit, not found, error handler |
| `config/` | Cấu hình env, database, CORS, JWT, email, Cloudinary |
| `utils/` | Helper dùng chung như token, AppError, asyncHandler, presenter |

Ví dụ với auth:

```txt
routes/auth.routes.js
→ controllers/auth.controller.js
→ services/auth.service.js
→ repositories/auth.repository.js
→ Prisma/PostgreSQL
```

### Express app tách khỏi server listener

`src/app.js` định nghĩa Express app, middleware chain và routes.

`src/server.js` chịu trách nhiệm start server.

Cách tách này giúp test integration có thể import `app` mà không cần mở port thật.

### Prisma repository pattern

Database access được gom trong `repositories/`. Service không viết Prisma query trực tiếp trong đa số flow chính.

Ví dụ:

```txt
auth.service.js
→ gọi findAccountByEmail()
→ auth.repository.js
→ prisma.account.findUnique()
```

### Centralized validation

Request được validate bằng Zod schema trong `validators/`, sau đó middleware `validate` đưa dữ liệu hợp lệ vào `req.validated`.

Controller sử dụng `req.validated.body` thay vì đọc trực tiếp `req.body`.

### Centralized error handling

Các controller được wrap bằng `asyncHandler`. Khi service throw `AppError`, lỗi được đưa về `errorHandler.middleware.js`.

Điều này giúp response lỗi thống nhất hơn và tránh lặp `try/catch` trong từng controller.

### Cookie-based auth với JWT

Auth hiện dùng access token và refresh token được set qua cookie. Backend có các helper:

- `setAuthCookies`
- `clearAuthCookies`
- `signAccessToken`
- `signRefreshToken`
- `verifyRefreshToken`
- `hashToken`

Refresh token được hash và lưu trong database, giúp có thể logout hoặc revoke token.

## 4. Luồng xử lý backend

Ví dụ request đăng nhập:

```txt
POST /login
→ auth.routes.js
→ authRateLimiter
→ validate(loginSchema)
→ auth.controller.js: login()
→ auth.service.js: login()
→ auth.repository.js: findAccountByEmail/findAccountByUsername()
→ bcrypt.compare()
→ tạo access token + refresh token
→ lưu refresh token hash vào database
→ set cookie
→ response user public
```

Ví dụ request quản lý driver:

```txt
GET /admin/drivers
→ driver.routes.js
→ requireAuth/requireRole
→ validate query
→ driver.controller.js
→ driver.service.js
→ driver.repository.js
→ Prisma
→ response data
```

## 5. Điểm mạnh

### Tách trách nhiệm rõ ràng

Route, controller, service và repository có vai trò riêng. Điều này giúp code dễ đọc, dễ review và dễ sửa khi nghiệp vụ tăng lên.

### Business logic nằm ở service

Các logic như đăng ký, đăng nhập, reset password, tạo token, kiểm tra trạng thái tài xế, xử lý ví/green passport được đặt ở service thay vì nhét trong route.

Đây là điểm tốt vì service có thể được test độc lập và không phụ thuộc trực tiếp vào HTTP request/response.

### Database access được gom lại

Repository pattern giúp Prisma query không bị rải khắp controller/service. Khi đổi query hoặc tối ưu database, developer biết nên tìm trong `repositories/`.

### Validation nhất quán

Zod schema và middleware `validate` giúp request sai bị chặn sớm trước khi vào controller. Dữ liệu hợp lệ được đặt vào `req.validated`, làm contract giữa route và controller rõ hơn.

### Error handling tập trung

`AppError`, `asyncHandler`, `errorHandler` tạo một flow xử lý lỗi thống nhất. Controller không phải lặp lại `try/catch` quá nhiều.

### Cấu hình tập trung

`config/index.js` gom env vars, JWT lifetime, cookie config, CORS origins, email config, Cloudinary config. Điều này giúp dễ audit và dễ thay đổi môi trường.

### App dễ test hơn

Do `app.js` tách khỏi `server.js`, integration test có thể dùng Supertest trực tiếp với Express app.

### Auth an toàn hơn localStorage token

Việc dùng cookie cho token, lưu refresh token dạng hash trong database, và có cơ chế xóa token khi logout/reset password là hướng tốt về bảo mật.

### Có sẵn nền tảng mở rộng

Khi thêm một resource mới, dự án đã có pattern rõ:

```txt
routes/<resource>.routes.js
controllers/<resource>.controller.js
services/<resource>.service.js
repositories/<resource>.repository.js
validators/<resource>.validator.js
```

## 6. Hạn chế

### Layered theo kỹ thuật, chưa gom theo domain

Hiện tại các file được chia theo layer kỹ thuật:

```txt
controllers/
services/
repositories/
routes/
validators/
```

Cách này dễ hiểu lúc đầu, nhưng khi số lượng domain tăng, một chức năng sẽ bị trải trên nhiều thư mục.

Ví dụ muốn sửa toàn bộ driver management, cần mở:

```txt
routes/driver.routes.js
controllers/driver.controller.js
services/driver.service.js
repositories/driver.repository.js
validators/driver.validator.js
```

Với dự án lớn hơn, có thể cân nhắc module-based structure:

```txt
modules/drivers/
├── driver.routes.js
├── driver.controller.js
├── driver.service.js
├── driver.repository.js
└── driver.validator.js
```

### Repository vẫn có thể chứa logic hơi cao cấp

Repository nên tập trung vào query database. Nếu repository bắt đầu chứa nhiều quyết định nghiệp vụ, layer sẽ bị mờ ranh giới.

Cần giữ nguyên tắc:

- Repository: lấy/lưu dữ liệu.
- Service: quyết định nghiệp vụ.

### Một số endpoint được mount hai lần

Trong `app.js`, routes đang được mount cả:

```js
app.use(routes);
app.use("/api", routes);
```

Điều này cho phép cùng một endpoint chạy ở cả `/login` và `/api/login`. Nó tiện cho tương thích, nhưng có thể gây mơ hồ về API contract chính thức.

Nên chọn một prefix chuẩn, thường là `/api`, rồi frontend dùng thống nhất prefix đó.

### Health check truy cập Prisma trực tiếp trong app.js

Endpoint `/health` gọi `prisma.$queryRaw` trực tiếp trong `app.js`. Đây là ngoại lệ nhỏ so với rule database access qua repository.

Với health check thì có thể chấp nhận được, nhưng nếu muốn nghiêm ngặt hơn, có thể tách thành health route/service.

### Error response còn tối giản

`errorHandler` hiện trả `{ message }`, nhưng validation middleware có tạo `error.details` và `error.field`. Các thông tin này chưa được trả về trong response.

Nếu frontend cần highlight field lỗi cụ thể, nên cân nhắc trả thêm:

```json
{
  "message": "...",
  "field": "...",
  "details": [...]
}
```

với điều kiện không làm lộ thông tin nhạy cảm.

### Chưa có dependency injection

Service import trực tiếp repository. Cách này đơn giản và ổn với dự án hiện tại, nhưng unit test service sẽ cần mock module import.

Khi dự án lớn hơn, có thể cân nhắc dependency injection nhẹ, nhưng chưa cần vội.

### Chưa có abstraction rõ cho transaction phức tạp

Một số logic cần transaction được đặt trong repository hoặc service tùy trường hợp. Nếu nghiệp vụ tài chính/điểm thưởng/phần thưởng phức tạp hơn, nên thống nhất transaction boundary:

- Service quyết định transaction use case.
- Repository nhận transaction client khi cần.

### API versioning chưa có

Hiện chưa có version prefix như `/api/v1`. Với MVP thì không sao. Khi có mobile app hoặc external client, versioning sẽ quan trọng hơn.

### Test coverage mới ở mức nền tảng

Server đã có unit/integration test, nhưng cần tiếp tục mở rộng cho các nghiệp vụ quan trọng:

- auth token lifecycle
- role-based access
- reward exchange idempotency
- driver approval flow
- collection schedule lifecycle
- customer pickup flow

## 7. Khi nào kiến trúc này phù hợp

Kiến trúc hiện tại phù hợp khi:

- Backend là REST API.
- Team cần pattern dễ hiểu, dễ onboard.
- Domain chưa quá lớn.
- Cần phát triển nhanh nhưng vẫn giữ separation of concerns.
- Dự án cần test integration bằng Supertest.
- Database dùng Prisma/PostgreSQL.

## 8. Khi nào cần cải thiện

Nên cải thiện khi:

- Số lượng resource tăng nhiều.
- Một use case phải chạm nhiều domain cùng lúc.
- Repository/service bắt đầu quá dài.
- Có nhiều client dùng API và cần versioning.
- Cần audit permission/security chặt hơn.
- Test service khó viết do import trực tiếp nhiều dependency.

## 9. Gợi ý chuẩn hóa tiếp theo

Các bước nên làm theo thứ tự ưu tiên:

1. Chọn một API prefix chính thức, ưu tiên `/api`, rồi bỏ dần route không prefix nếu không còn cần.
2. Chuẩn hóa error response để frontend có thể xử lý validation field rõ hơn.
3. Giữ rule controller không chứa business logic và không gọi Prisma trực tiếp.
4. Khi một domain lớn lên, cân nhắc chuyển từ layer-based folder sang module-based folder.
5. Bổ sung test cho các use case nghiệp vụ quan trọng.
6. Thống nhất transaction boundary cho các flow liên quan ví, điểm, phần thưởng và lịch thu gom.
7. Cân nhắc `/api/v1` nếu API bắt đầu có nhiều client hoặc cần backward compatibility.

## 10. Kết luận

Backend hiện tại là một Express REST API theo layered architecture, dùng Prisma repository pattern, Zod validation, centralized error handling và cookie-based JWT auth.

Điểm mạnh lớn nhất là separation of concerns rõ, dễ mở rộng theo resource và dễ test integration. Điểm hạn chế chính là cấu trúc theo layer có thể làm code của một domain bị phân tán khi dự án lớn hơn, một số convention chưa hoàn toàn chặt như double route mount, error response còn tối giản và API chưa có versioning.
