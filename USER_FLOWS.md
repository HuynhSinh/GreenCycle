# GreenCycle User Flow Guide

Tài liệu này hướng dẫn các luồng sử dụng quan trọng trong hệ thống GreenCycle. Tên màn hình, nút bấm và trạng thái được giữ bằng tiếng Anh theo đúng giao diện hiện tại để dễ đối chiếu khi thao tác.

## 1. Customer tạo tài khoản và đặt pickup đầu tiên

### Mục tiêu

Customer tạo tài khoản, đăng nhập vào hệ thống và gửi yêu cầu thu gom rác tái chế đầu tiên.

### Các bước thực hiện

1. Mở frontend của hệ thống.
   - Mặc định: `http://localhost:5173`

2. Vào màn hình đăng ký tài khoản.
   - Chọn vai trò Customer nếu form có lựa chọn role.
   - Nhập đầy đủ thông tin bắt buộc.
   - Sau khi đăng ký thành công, hệ thống sẽ tự tạo Customer profile, Eco Wallet và Green Passport cho tài khoản.

3. Đăng nhập bằng tài khoản vừa tạo.

4. Trong Customer Portal, mở tab `Pickups`.

5. Nhấn nút `New Pickup` để mở form tạo yêu cầu thu gom.

6. Nhập thông tin pickup:
   - `Full name *`: họ tên người gửi yêu cầu.
   - `Phone number *`: số điện thoại liên hệ.
   - `Address line *`: địa chỉ chi tiết.
   - `Ward *`: phường, bắt buộc nhập.
   - `District`: quận, không bắt buộc.
   - `City *`: thành phố.
   - `Pickup date *`: ngày thu gom mong muốn.
   - `Pickup time *`: khung giờ thu gom.
   - `Waste Items`: chọn loại rác và nhập số kg ước tính cho từng loại.

7. Chọn thời gian hợp lệ.
   - Hệ thống chỉ cho đặt trong khung `08:00-17:00`, mỗi 30 phút.
   - Thời điểm được chọn phải nằm trong tương lai.

8. Nhấn `Submit Pickup Request`.

9. Khi tạo thành công, hệ thống hiển thị thông báo thành công và tự làm mới danh sách.
   - Pickup mới sẽ xuất hiện trong `My Pickups`.
   - Trạng thái ban đầu là `Pending`.

### Sau khi tạo pickup

- Customer có thể nhấn `View` để xem chi tiết pickup.
- Customer chỉ có thể `Edit` hoặc `Cancel` khi pickup còn ở trạng thái `Pending`.
- Khi nhấn `Cancel`, hệ thống sẽ hiển thị popup xác nhận trước khi hủy.
- Sau khi admin approve hoặc assign, Customer không còn được sửa hoặc hủy pickup đó.

## 2. Quy trình cấp và phê duyệt tài khoản driver

### Mục tiêu

Admin tạo tài khoản driver, driver hoàn thiện hồ sơ phương tiện, sau đó admin phê duyệt để driver được nhận nhiệm vụ.

### Các bước dành cho admin

1. Đăng nhập bằng tài khoản Admin.

2. Vào `Driver Management`.

3. Nhấn `New Driver`.

4. Nhập thông tin tài khoản driver:
   - `Username *`: tên đăng nhập.
   - `Temporary password *`: mật khẩu tạm thời.
   - `Email`: không bắt buộc.
   - Các thông tin hồ sơ như `Full name`, `Phone number`, `Vehicle`, `License plate`, `Maximum capacity (kg)` có thể nhập ngay hoặc để driver tự cập nhật sau.

5. Nhấn `Create Driver`.

6. Gửi username và mật khẩu tạm thời cho driver để driver đăng nhập.

### Các bước dành cho driver

1. Driver đăng nhập bằng tài khoản được admin cấp.

2. Mở tab `Profile`.

3. Nhập đầy đủ thông tin hồ sơ bắt buộc:
   - `Full name *`
   - `Phone number *`
   - `Vehicle *`
   - `License plate *`
   - `Maximum capacity (kg) *`
   - `Email *`

4. Nhấn `Submit Profile`.

5. Sau khi gửi hồ sơ, trạng thái driver là `Pending approval`.
   - Driver chưa thể nhận hoặc thực hiện assignment.
   - Tab `Assignments` bị khóa cho đến khi admin approve.

### Admin phê duyệt driver

1. Admin quay lại `Driver Management`.

2. Tìm driver có trạng thái `Pending approval`.

3. Chọn driver trong danh sách.

4. Kiểm tra thông tin xe và `Maximum capacity`.

5. Nhấn `Approve Driver`.

6. Sau khi phê duyệt thành công:
   - Driver chuyển sang trạng thái `Active`.
   - Driver có thể được assign pickup.

### Lưu ý quan trọng

- `Active` nghĩa là driver đã được duyệt và có thể nhận nhiệm vụ.
- `Inactive` nghĩa là driver đang bị vô hiệu hóa, không được nhận nhiệm vụ mới.
- `Pending approval` nghĩa là driver đã gửi hoặc cập nhật hồ sơ và đang chờ admin duyệt.
- `Pending profile` nghĩa là tài khoản driver chưa hoàn thiện hồ sơ.
- Nếu driver đang `Active` nhưng cập nhật lại thông tin phương tiện hoặc sức chứa, hệ thống sẽ chuyển driver về `Pending approval` để admin kiểm tra lại.

## 3. Quá trình driver thực hiện pickup

### Mục tiêu

Driver xem danh sách pickup được assign, thực hiện thu gom, chụp ảnh minh chứng và nhập số kg thực tế.

### Điều kiện trước khi thực hiện

- Driver phải có trạng thái `Approved`.
- Pickup phải được admin assign cho driver.
- Mỗi driver chỉ được thực hiện 1 pickup đang chạy tại cùng một thời điểm.

### Các bước thực hiện

1. Driver đăng nhập vào hệ thống.

2. Mở tab `Assignments`.

3. Nhấn `Refresh` để tải danh sách nhiệm vụ mới nhất nếu cần.

4. Chọn một pickup trong danh sách `Assigned Pickups`.

5. Xem thông tin trong `Pickup Task`:
   - Customer.
   - Address.
   - Scheduled weight.
   - Danh sách waste items cần thu gom.

6. Khi bắt đầu đi thu gom, nhấn `Start Pickup`.
   - Pickup chuyển sang trạng thái `Collecting`.

7. Khi đã đến địa điểm thu gom, nhấn `Mark Arrived`.
   - Pickup chuyển sang trạng thái `Arrived`.

8. Khi đã thu gom xong, driver phải nhập kết quả thực tế:
   - Upload `Evidence photo *`: ảnh minh chứng thu gom.
   - Nhập actual kg cho từng waste item được hẹn lịch.

9. Nhấn `Mark Collected`.

10. Khi cập nhật thành công:
   - Pickup chuyển sang trạng thái `Collected`.
   - Ảnh minh chứng được lưu để admin xem lại.
   - Số kg thực tế được lưu theo từng waste item.
   - Eco-points được cộng vào ví của customer sau khi pickup ở trạng thái `Collected`.

### Lưu ý quan trọng

- Driver không thể `Mark Collected` nếu thiếu ảnh minh chứng.
- Driver không thể `Mark Collected` nếu thiếu số kg thực tế của bất kỳ waste item nào.
- Driver không thể bắt đầu pickup thứ hai khi vẫn còn pickup khác đang ở trạng thái `Collecting` hoặc `Arrived`.

## 4. Admin duyệt và assign pickup

### Mục tiêu

Admin xem danh sách pickup request, approve hoặc reject request, sau đó assign driver phù hợp.

### Các bước thực hiện

1. Đăng nhập bằng tài khoản Admin.

2. Vào `Collection Schedule Management`.

3. Xem danh sách trong `Pickup Requests`.
   - Nếu không chọn ngày, hệ thống hiển thị toàn bộ pickup.
   - Có thể dùng `Today` để lọc pickup hôm nay.
   - Có thể dùng `All dates` để quay lại xem tất cả ngày.
   - Có thể dùng ô search để tìm theo request, ward hoặc item.
   - Có thể dùng bộ lọc `All statuses`, `Pending`, `Approved`, `Assigned`, `Collecting`, `Arrived`, `Collected`, `Cancelled`, `Rejected`, `Failed`, `Rescheduled`.

4. Nhấn `Refresh` nếu muốn tải lại dữ liệu mới nhất.

5. Chọn một pickup request trong bảng.
   - Hệ thống không tự chọn item đầu tiên.
   - Admin cần chọn đúng pickup muốn thao tác.

6. Nếu pickup đang `Pending`, admin có thể:
   - Nhấn `Approve` để duyệt request.
   - Nhấn `Reject` để từ chối request.

7. Khi nhấn `Reject`, hệ thống sẽ hiển thị popup xác nhận.
   - Admin có thể nhập lý do từ chối.
   - Sau khi xác nhận, pickup chuyển sang trạng thái `Rejected`.

8. Sau khi pickup được `Approved`, admin chọn driver trong danh sách `Available drivers`.

9. Nhấn `Assign`.

10. Khi assign thành công:
   - Pickup chuyển sang trạng thái `Assigned`.
   - Driver sẽ thấy pickup trong tab `Assignments`.

### Điều kiện assign driver

Hệ thống chỉ cho assign khi thỏa các điều kiện sau:

- Pickup đang ở trạng thái `Approved`.
- Driver đang `Active`.
- Driver không bị trùng lịch với pickup khác.
- Sức chứa còn lại của xe đủ nhận pickup:

```text
assignedWeight + pickup.totalWeight <= driver.maxCapacityKg
```

Trong đó:

- `assignedWeight`: tổng kg của các pickup đã assign cho driver trong ngày hoặc trong phạm vi đang được hệ thống tính tải.
- `pickup.totalWeight`: tổng kg ước tính của pickup đang cần assign.
- `driver.maxCapacityKg`: sức chứa tối đa của xe driver.

Nếu vượt quá sức chứa hoặc bị trùng lịch, hệ thống sẽ báo lỗi và không assign.

## Bảng trạng thái tham khảo

### Pickup Request

| Trạng thái | Ý nghĩa |
| --- | --- |
| `Pending` | Customer vừa tạo pickup, đang chờ admin duyệt. |
| `Approved` | Admin đã duyệt, pickup sẵn sàng để assign driver. |
| `Assigned` | Pickup đã được gán cho driver. |
| `Collecting` | Driver đã bắt đầu thực hiện pickup. |
| `Arrived` | Driver đã đến địa điểm thu gom. |
| `Collected` | Driver đã thu gom xong, có ảnh minh chứng và số kg thực tế. |
| `Cancelled` | Customer đã hủy khi pickup còn pending. |
| `Rejected` | Admin đã từ chối pickup. |
| `Failed` | Pickup không thực hiện thành công. |
| `Rescheduled` | Pickup được dời lịch. |

### Driver Account

| Trạng thái | Ý nghĩa |
| --- | --- |
| `Pending profile` | Driver chưa hoàn thiện hồ sơ. |
| `Pending approval` | Driver đã gửi hoặc cập nhật hồ sơ, đang chờ admin duyệt. |
| `Active` | Driver đã được duyệt và có thể nhận assignment. |
| `Inactive` | Driver bị vô hiệu hóa và không thể nhận assignment mới. |

