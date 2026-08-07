# Kiến trúc frontend hiện tại

## 1. Tổng quan

Frontend của GreenCycle hiện đang dùng kiến trúc React theo hướng feature-based, chạy trên Vite và styled bằng Tailwind CSS.

Stack chính:

- React 18
- Vite
- React Router
- Tailwind CSS
- React Hook Form
- Zod
- Fetch API qua wrapper `apiRequest`
- Lucide React cho icon

Mục tiêu của kiến trúc này là chia code theo từng nhóm chức năng nghiệp vụ, đồng thời giữ các phần dùng chung như route, API client, component chung và validator ở các thư mục cấp cao.

## 2. Cấu trúc thư mục chính

```txt
client/src/
├── app/
│   └── routes.jsx
├── assets/
├── components/
│   ├── BrandLogo.jsx
│   ├── ProtectedRoute.jsx
│   └── ui/
├── features/
│   ├── auth/
│   ├── collection-schedules/
│   ├── customer-pickups/
│   ├── dashboard/
│   ├── driver-assignments/
│   ├── drivers/
│   └── rewards/
├── hooks/
├── lib/
├── pages/
├── App.jsx
├── main.jsx
└── index.css
```

## 3. Kiểu kiến trúc đang sử dụng

### Feature-based architecture

Các nghiệp vụ chính được gom trong `features/`. Ví dụ:

- `features/drivers`: API và page quản lý tài xế.
- `features/rewards`: API và page quản lý phần thưởng.
- `features/collection-schedules`: API và page quản lý lịch thu gom.
- `features/auth`: API và form đăng nhập, đăng ký, quên mật khẩu, reset mật khẩu.
- `features/dashboard`: các dashboard theo vai trò.

Mỗi feature thường có các phần:

```txt
features/<feature-name>/
├── api/
├── components/
└── pages/
```

Không phải feature nào cũng có đủ cả ba thư mục. Dự án hiện đang tạo theo nhu cầu thực tế.

### Page composition

Route được khai báo tập trung trong `client/src/app/routes.jsx`.

Các page public như login, signup, forgot password, reset password hiện nằm trong `client/src/pages`. Các page này chủ yếu đóng vai trò wrapper layout, sau đó compose form từ `features/auth/components`.

Ví dụ:

```txt
pages/Login/LoginPage.jsx
└── dùng LoginForm từ features/auth/components/LoginForm.jsx
```

Trong khi đó, một số page nghiệp vụ như `DriverManagement`, `AdminRewardManagement`, `CollectionScheduleManagement` lại nằm trực tiếp trong `features/<feature>/pages`.

Điều này cho thấy frontend hiện đang dùng kiến trúc feature-based nhưng chưa hoàn toàn thuần nhất. Có sự pha trộn giữa:

- `pages/` cấp cao cho các route public.
- `features/*/pages` cho các route nghiệp vụ.

### Shared layer

Các phần dùng chung được đặt ở cấp `src`:

- `components/`: component dùng chung, ví dụ `BrandLogo`, `ProtectedRoute`, `ConfirmDialog`.
- `lib/`: helper chung như `api-client.js`, `validators.js`, `messages.js`.
- `hooks/`: hook dùng chung như `useAuth`.
- `assets/`: tài nguyên tĩnh.

## 4. Luồng xử lý frontend

Một request thông thường đi theo hướng:

```txt
Page/Component
→ feature api function
→ lib/api-client.js
→ backend API
```

Ví dụ quản lý driver:

```txt
features/drivers/pages/DriverManagement.jsx
→ features/drivers/api/drivers.js
→ lib/api-client.js
→ /admin/drivers
```

Với auth:

```txt
pages/Login/LoginPage.jsx
→ features/auth/components/LoginForm.jsx
→ features/auth/api/auth.js
→ lib/api-client.js
→ /login
```

## 5. Điểm mạnh

### Dễ tìm code theo nghiệp vụ

Các chức năng như driver, reward, schedule được gom theo feature. Khi cần sửa chức năng driver, developer có thể bắt đầu ở `features/drivers` thay vì phải tìm rải rác khắp project.

### Tách được API khỏi UI

API call của từng nghiệp vụ được đặt trong `features/<feature>/api`. Component không phải tự viết URL và fetch logic quá nhiều lần.

### Có API client dùng chung

`lib/api-client.js` gom base URL, credentials, header JSON và xử lý lỗi cơ bản. Điều này giúp giảm trùng lặp khi gọi backend.

### Route tập trung

`app/routes.jsx` giúp nhìn được toàn bộ route chính của ứng dụng ở một nơi. Việc kiểm soát route public/protected khá rõ ràng.

### Có guard cho route cần đăng nhập

`ProtectedRoute` kiểm tra user hiện tại qua API `getMe`, sau đó điều hướng theo role. Đây là cách tốt hơn so với chỉ tin dữ liệu trong localStorage.

### Form auth có validation

Các form auth dùng React Hook Form kết hợp Zod, giúp tách schema validation khỏi JSX và giảm lỗi nhập liệu.

### Phù hợp với dự án vừa và nhỏ

Với quy mô hiện tại, feature-based architecture đủ dễ hiểu, ít ceremony, và không cần framework nặng như Next.js hoặc kiến trúc quá nhiều layer ở frontend.

## 6. Hạn chế

### Cấu trúc page chưa nhất quán

Auth page nằm trong `src/pages`, còn nhiều page nghiệp vụ nằm trong `features/*/pages`. Cả hai cách đều có lý, nhưng khi dự án lớn hơn sẽ dễ gây tranh luận:

- Page mới nên đặt ở `pages/` hay `features/<feature>/pages`?
- Auth có phải một feature không?
- Page route-level có nên chỉ compose feature không?

Nếu muốn nhất quán theo feature-based architecture, có thể chuyển auth pages vào:

```txt
features/auth/pages/
```

Hoặc nếu muốn theo page composition architecture, có thể đưa toàn bộ route-level pages về:

```txt
src/pages/
```

và để `features/` chỉ chứa components, hooks, api, types.

### Page đang chứa khá nhiều logic

Một số page như `DriverManagement.jsx` đang chứa nhiều state, fetch, form handling, modal handling, table rendering và sidebar logic trong cùng một file.

Điều này dễ phát triển nhanh lúc đầu, nhưng về sau sẽ khó test, khó review và khó tái sử dụng.

Nên cân nhắc tách dần thành:

- `features/drivers/hooks/useAdminDrivers.js`
- `features/drivers/components/DriverTable.jsx`
- `features/drivers/components/DriverDetailPanel.jsx`
- `features/drivers/components/CreateDriverForm.jsx`

### Chưa dùng React Query cho server state

Dữ liệu từ server hiện được fetch thủ công bằng `useEffect`, `useState`, `useCallback`. Cách này hoạt động, nhưng sẽ phải tự xử lý nhiều vấn đề:

- loading state
- error state
- refetch
- cache
- pagination state
- stale data
- retry

Nếu dự án lớn hơn, TanStack Query sẽ phù hợp hơn cho server state.

### Auth state chưa thật sự thống nhất

Backend đang dùng cookie httpOnly cho token, nhưng frontend vẫn còn một số dấu vết localStorage như `userInfo`, `accessToken`, `refreshToken` trong `useAuth` và một số chỗ logout.

Trong khi đó `ProtectedRoute` lại kiểm tra đăng nhập bằng `/me`, tức là dựa vào cookie.

Nên thống nhất một mô hình:

- Nếu dùng cookie httpOnly: frontend không cần lưu access token trong localStorage.
- Nếu dùng bearer token: cần cơ chế refresh token rõ ràng và bảo vệ token tốt hơn.

Với code hiện tại, hướng cookie httpOnly an toàn hơn.

### Chưa có public export rõ ràng cho feature

Các feature chưa có `index.js` làm public API. Component của feature khác đôi khi import trực tiếp vào internal path.

Khi project lớn, nên hạn chế import sâu như:

```js
import { logout } from '../../auth/api/auth';
```

và cân nhắc public export:

```js
import { logout } from '../auth';
```

### Chưa có tầng hooks riêng cho feature API

Hiện tại page gọi thẳng API function. Với feature phức tạp, nên có custom hooks để gom logic fetching/mutation.

Ví dụ:

```txt
features/drivers/hooks/useAdminDrivers.js
features/drivers/hooks/useCreateDriver.js
```

### Chưa có test frontend

`package.json` của client hiện chưa có script test. Khi UI và form logic nhiều hơn, thiếu test sẽ làm việc refactor rủi ro hơn.

## 7. Khi nào kiến trúc này phù hợp

Kiến trúc hiện tại phù hợp khi:

- Team nhỏ hoặc vừa.
- Ứng dụng là admin/customer/driver portal.
- Các domain nghiệp vụ tương đối rõ.
- Muốn phát triển nhanh nhưng vẫn có tổ chức.
- Chưa cần SSR hoặc SEO mạnh.

## 8. Khi nào cần cải thiện

Nên cải thiện khi:

- Một page vượt quá khoảng 200-300 dòng và có nhiều trách nhiệm.
- Nhiều feature cần dùng chung logic.
- Dữ liệu server bắt đầu phức tạp, cần cache/refetch.
- Có nhiều role, permission, flow auth phức tạp hơn.
- Team có nhiều người cùng phát triển frontend.

## 9. Gợi ý chuẩn hóa tiếp theo

Các bước nên làm theo thứ tự ưu tiên:

1. Chọn một quy ước page duy nhất:
   - Hoặc tất cả route-level pages ở `src/pages`.
   - Hoặc tất cả page thuộc nghiệp vụ nằm trong `features/<feature>/pages`.
2. Chuẩn hóa auth theo cookie httpOnly, bỏ dần `accessToken` và `refreshToken` khỏi localStorage nếu không còn dùng.
3. Tách các page lớn thành hooks và component nhỏ.
4. Thêm `index.js` cho từng feature để kiểm soát public exports.
5. Cân nhắc thêm TanStack Query nếu số lượng request và màn hình quản trị tăng lên.
6. Thêm test cho form auth, protected route và các workflow quản trị quan trọng.

## 10. Kết luận

Frontend hiện tại là một React/Vite/Tailwind app theo hướng feature-based architecture, có tổ chức tương đối rõ và phù hợp với quy mô MVP/portal hiện tại.

Điểm mạnh lớn nhất là dễ tìm code theo nghiệp vụ và dễ phát triển nhanh. Điểm hạn chế lớn nhất là kiến trúc chưa hoàn toàn nhất quán, một số page đang ôm nhiều trách nhiệm, và state từ server chưa có cơ chế quản lý chuyên dụng.
