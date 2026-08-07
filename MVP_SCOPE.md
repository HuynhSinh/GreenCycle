# GreenCycle MVP Scope

Ngày cập nhật: 2026-08-06

## 1. Mục tiêu MVP

GreenCycle MVP là nền tảng đặt lịch thu gom rác tái chế tại nhà, tập trung vào 3 nhóm người dùng chính:

- Customer: tạo yêu cầu thu gom, theo dõi trạng thái, nhận Eco-points và đổi phần thưởng.
- Admin: quản lý yêu cầu thu gom, tài xế và phần thưởng.
- Driver: hoàn thiện hồ sơ, nhận nhiệm vụ thu gom và cập nhật kết quả thực tế.

Mục tiêu của MVP là chứng minh được luồng vận hành cốt lõi:

1. Customer đăng ký/đăng nhập và gửi pickup request.
2. Admin duyệt request và gán driver phù hợp.
3. Driver thực hiện pickup, gửi ảnh minh chứng và nhập khối lượng thực tế.
4. Hệ thống cộng Eco-points cho customer.
5. Customer dùng Eco-points để đổi phần thưởng vật lý.

## 2. Vai trò người dùng

### Customer

Customer là người đặt lịch thu gom rác tái chế.

Phạm vi hiện tại:

- Đăng ký tài khoản customer.
- Đăng nhập, đăng xuất.
- Quên mật khẩu và đặt lại mật khẩu bằng OTP.
- Tạo pickup request.
- Xem danh sách pickup của chính mình.
- Xem chi tiết pickup.
- Chỉnh sửa hoặc hủy pickup khi trạng thái còn `PENDING`.
- Xem Eco Wallet, lịch sử điểm và lịch sử đổi thưởng.
- Xem danh sách reward khả dụng.
- Đổi reward bằng Eco-points.

### Admin

Admin là người vận hành hệ thống.

Phạm vi hiện tại:

- Đăng nhập vào admin portal.
- Xem dashboard tổng quan vận hành.
- Xem danh sách pickup request.
- Lọc/tìm pickup request theo ngày, trạng thái, địa bàn hoặc từ khóa.
- Approve hoặc reject pickup request.
- Gán pickup đã approve cho driver.
- Tạo tài khoản driver.
- Xem danh sách và chi tiết driver.
- Approve driver sau khi driver hoàn thiện hồ sơ.
- Enable/disable driver.
- Quản lý reward: tạo, sửa, xóa, cập nhật tồn kho.

### Driver

Driver là người thực hiện thu gom.

Phạm vi hiện tại:

- Đăng nhập bằng tài khoản do admin tạo.
- Xem và cập nhật hồ sơ cá nhân/phương tiện.
- Chờ admin duyệt hồ sơ trước khi nhận assignment.
- Xem danh sách pickup được assign.
- Bắt đầu pickup: `ASSIGNED` -> `COLLECTING`.
- Đánh dấu đã đến nơi: `COLLECTING` -> `ARRIVED`.
- Đánh dấu đã thu gom: `COLLECTING` hoặc `ARRIVED` -> `COLLECTED`.
- Upload ảnh minh chứng thu gom.
- Nhập khối lượng thực tế cho từng waste item.

## 3. Luồng nghiệp vụ trong scope

### 3.1 Authentication

Bao gồm:

- Customer self-register.
- Login bằng username/email và password.
- Logout.
- Lấy thông tin tài khoản hiện tại qua `/me`.
- Refresh/access token flow ở backend.
- Forgot password bằng OTP gửi qua email.
- Reset password.
- Phân quyền route theo role: `CUSTOMER`, `DRIVER`, `ADMIN`.

Giới hạn hiện tại:

- Customer là vai trò duy nhất có self-registration.
- Driver account được tạo bởi admin.
- Chưa có màn hình self-service cho partner staff.

### 3.2 Customer Pickup Booking

Customer có thể:

- Mở customer portal tại `/dashboard/customer`.
- Tạo pickup mới từ tab `Pickups`.
- Nhập thông tin liên hệ, địa chỉ, ngày giờ, ghi chú và danh sách waste item.
- Chọn waste category và khối lượng ước tính.
- Chỉ đặt lịch trong khung giờ 08:00-17:00, theo slot 30 phút.
- Chỉ đặt pickup trong tương lai.
- Xem pickup list và pickup details.
- Edit hoặc cancel pickup khi request còn `PENDING`.

Trạng thái khởi tạo:

- Pickup mới bắt đầu ở `PENDING`.

### 3.3 Admin Collection Schedule

Admin có thể:

- Xem pickup requests trong module `Collection Schedules`.
- Xem metrics cơ bản: requests cần schedule, assigned pickups, active drivers, time conflicts.
- Lọc pickup theo ngày, district, status, page/limit.
- Approve pickup đang `PENDING`.
- Reject pickup đang `PENDING` hoặc `APPROVED`, có thể ghi lý do.
- Assign driver cho pickup đã `APPROVED`.

Điều kiện assign:

- Pickup phải ở trạng thái `APPROVED`.
- Driver phải active.
- Driver phải có `maxCapacityKg` hợp lệ.
- Tổng tải đã assign trong ngày cộng với pickup mới không vượt `maxCapacityKg`.
- Driver không có assignment active trùng đúng thời điểm scheduled time.

Sau khi assign:

- Pickup chuyển sang `ASSIGNED`.
- Assignment được tạo hoặc cập nhật.
- Timeline ghi nhận hành động assign.

### 3.4 Driver Management

Admin có thể:

- Tạo driver account với username, temporary password, email và thông tin hồ sơ nếu có.
- Xem danh sách driver.
- Lọc driver theo trạng thái.
- Xem chi tiết driver.
- Approve driver.
- Enable driver.
- Disable driver.

Driver có thể:

- Cập nhật full name, phone number, vehicle, license plate, max capacity và email.
- Gửi hồ sơ để admin duyệt.
- Nếu driver đã active nhưng cập nhật thông tin phương tiện hoặc capacity, hồ sơ cần được duyệt lại.

Trạng thái driver đang dùng:

- `PENDING_PROFILE`
- `PENDING_APPROVAL`
- `ACTIVE`
- `INACTIVE`

### 3.5 Driver Assignment Execution

Driver active có thể:

- Xem assignments của mình.
- Chọn một assignment để xem chi tiết customer, địa chỉ, lịch hẹn, tổng kg và waste items.
- Start pickup khi request đang `ASSIGNED`.
- Mark arrived khi request đang `COLLECTING`.
- Mark collected khi request đang `COLLECTING` hoặc `ARRIVED`.

Ràng buộc:

- Driver chỉ được xử lý một assignment ở trạng thái `COLLECTING` hoặc `ARRIVED` tại cùng thời điểm.
- Khi mark collected, bắt buộc có ảnh minh chứng.
- Khi mark collected, bắt buộc nhập actual weight cho mọi waste item đã schedule.
- Actual weight được dùng để tính lại points earned và CO2 reduced.
- Evidence image hiện được upload qua Cloudinary service.

Sau khi collected:

- Pickup chuyển sang `COLLECTED`.
- Waste items được cập nhật actual weight và points.
- Evidence image được lưu.
- Eco Wallet, transaction và Green Passport của customer được cập nhật ở backend.

### 3.6 Rewards And Eco-points

Customer có thể:

- Xem Eco-point balance.
- Xem lịch sử giao dịch điểm.
- Xem reward exchanges.
- Xem danh sách rewards đang khả dụng.
- Redeem reward nếu đủ điểm và còn tồn kho.

Admin có thể:

- Tạo reward.
- Cập nhật thông tin reward.
- Cập nhật inventory.
- Xóa reward.
- Xem metrics reward như available rewards và low stock rewards.

Ràng buộc hiện tại:

- Customer redemption hiện chỉ hỗ trợ `PHYSICAL_PRODUCT`.
- Redemption có idempotency key để tránh trừ điểm lặp.
- Nếu không đủ điểm hoặc hết hàng, hệ thống từ chối redemption.

## 4. Màn hình trong MVP

### Public/Auth

- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`

### Admin

- `/dashboard/admin`
- `/dashboard/admin/schedules`
- `/dashboard/admin/drivers`
- `/dashboard/admin/rewards`

### Customer

- `/dashboard/customer`

Tabs chính:

- `Pickups`
- `Rewards`

### Driver

- `/dashboard/driver`

Tabs chính:

- `Profile`
- `Assignments`

## 5. API surface trong MVP

### Auth

- `POST /register`
- `POST /login`
- `POST /forgot-password`
- `POST /reset-password`
- `POST /logout`
- `GET /me`

### Customer pickups

- `GET /customer/pickup-booking`
- `GET /customer/pickups`
- `POST /customer/pickups`
- `GET /customer/pickups/:pickupId`
- `PUT /customer/pickups/:pickupId`
- `PATCH /customer/pickups/:pickupId/cancel`

### Customer rewards

- `GET /customer/wallet`
- `GET /customer/rewards`
- `POST /customer/rewards/:rewardId/redeem`

### Admin collection schedules

- `GET /admin/collection-schedules`
- `PATCH /admin/collection-schedules/assign`
- `PATCH /admin/collection-schedules/:requestId/approve`
- `PATCH /admin/collection-schedules/:requestId/reject`

### Driver assignments

- `GET /driver/assignments`
- `PATCH /driver/assignments/:assignmentId/status`

### Driver management

- `GET /driver/profile`
- `PUT /driver/profile`
- `GET /admin/drivers`
- `POST /admin/drivers`
- `GET /admin/drivers/:accountId`
- `PATCH /admin/drivers/:accountId/approve`
- `PATCH /admin/drivers/:accountId/enable`
- `PATCH /admin/drivers/:accountId/disable`

### Admin rewards

- `GET /admin/rewards`
- `POST /admin/rewards`
- `PUT /admin/rewards/:rewardId`
- `PATCH /admin/rewards/:rewardId/inventory`
- `DELETE /admin/rewards/:rewardId`

## 6. Data model trong MVP

Các model đang trực tiếp phục vụ MVP:

- `Account`
- `RefreshToken`
- `PasswordResetToken`
- `Customer`
- `Driver`
- `Address`
- `PickupRequest`
- `PickupAssignment`
- `PickupTimeline`
- `WasteCategory`
- `WasteItem`
- `WasteImage`
- `EcoWallet`
- `Transaction`
- `GreenPassport`
- `Reward`
- `RewardInventory`
- `VoucherCode`
- `RewardExchange`

Các enum chính:

- `UserRole`
- `PickupStatus`
- `TransactionType`
- `RewardType`

## 7. Ngoài phạm vi MVP hiện tại

Các phần sau có model hoặc ý tưởng trong hệ thống nhưng chưa phải scope vận hành chính của MVP hiện tại:

- Portal riêng cho recycling partner hoặc partner staff.
- Luồng bàn giao pickup cho recycling partner.
- Enterprise/B2B onboarding hoàn chỉnh.
- ESG report generation trên giao diện.
- Notification center cho user.
- Audit log viewer cho admin.
- Route optimization thực tế.
- Collection cluster management đầy đủ.
- Realtime driver location tracking.
- Bản đồ, geocoding hoặc điều phối theo vị trí thực.
- Payment hoặc cash settlement.
- Digital voucher redemption cho customer.
- Quản lý voucher code chi tiết trên giao diện.
- Customer reschedule sau khi request đã được approve/assign.
- Driver báo failed/rescheduled từ giao diện.
- Mobile app native.
- Tích hợp SMS/Zalo/Push notification.

## 8. Tiêu chí hoàn thành MVP

MVP được xem là hoàn thành khi các luồng sau chạy ổn định end-to-end:

- Customer đăng ký, đăng nhập, tạo pickup và thấy request ở trạng thái `PENDING`.
- Admin approve request và assign cho một driver active, không vượt tải và không trùng lịch.
- Driver nhìn thấy assignment, chuyển trạng thái qua `COLLECTING`, `ARRIVED`, `COLLECTED`.
- Driver upload evidence photo và nhập actual kg khi hoàn tất.
- Customer nhận Eco-points sau pickup collected.
- Customer đổi được physical reward nếu đủ điểm và còn stock.
- Admin quản lý được driver lifecycle và reward catalog/inventory.
- Các route quan trọng được bảo vệ bằng authentication và role authorization.
- Local setup chạy được với PostgreSQL, Prisma migrations, backend và frontend.

## 9. Ghi chú kỹ thuật

- Frontend: React, Vite, Tailwind CSS.
- Backend: Node.js, Express.
- Database: PostgreSQL.
- ORM: Prisma.
- Evidence image upload: Cloudinary service.
- Local backend mặc định: `http://localhost:3000`.
- Local frontend mặc định: `http://localhost:5173`.
- Local PostgreSQL mặc định: `localhost:5433`.
