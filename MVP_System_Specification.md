# ĐẶC TẢ HỆ THỐNG VÀ WORKFLOW — GREENCYCLE MVP

**Phiên bản:** 1.0  
**Phạm vi thí điểm:** Quận 5, Thành phố Hồ Chí Minh  
**Nền tảng:** Responsive Web Application

## 1. Tổng quan

GreenCycle là nền tảng hỗ trợ người dùng đăng ký thu gom rác thải điện tử (e-waste) tại nhà, trường học hoặc văn phòng. Hệ thống kết nối người dùng, quản trị viên và tài xế để tiếp nhận yêu cầu, lập lịch, thu gom, xác minh và ghi nhận phần thưởng Eco-Point.

MVP tập trung kiểm chứng ba giá trị cốt lõi:

- **Tiện lợi:** Người dùng có thể tạo yêu cầu thu gom trực tuyến.
- **Minh bạch:** Người dùng theo dõi được trạng thái của yêu cầu.
- **Khuyến khích tái chế:** Người dùng nhận Eco-Point sau khi rác được xác minh và xử lý thành công.

## 2. Mục tiêu MVP

- Cho phép người dùng đăng ký, đăng nhập và quản lý thông tin cơ bản.
- Cho phép tạo và theo dõi yêu cầu thu gom e-waste.
- Hỗ trợ quản trị viên duyệt yêu cầu, lập lịch và phân công tài xế.
- Cho phép quản trị viên tạo, cập nhật, khóa và theo dõi tình trạng hoạt động của tài xế.
- Cho phép tài xế cập nhật kết quả thu gom và số lượng thực tế.
- Tự động cộng Eco-Point sau khi yêu cầu hoàn tất.
- Cho phép người dùng đổi Eco-Point lấy phần thưởng có sẵn trong kho.
- Cung cấp dữ liệu vận hành cơ bản để đánh giá chương trình thí điểm.

## 3. Phạm vi hệ thống

### 3.1. Trong phạm vi MVP

- Đăng ký, đăng nhập và đăng xuất.
- Quản lý hồ sơ và địa chỉ nhận hàng cơ bản.
- Tạo, xem, sửa hoặc hủy yêu cầu thu gom theo điều kiện.
- Khai báo loại e-waste, số lượng ước tính và ảnh minh họa.
- Quản lý lịch thu gom.
- Theo dõi trạng thái yêu cầu.
- Quản trị yêu cầu và phân công tài xế.
- Quản lý hồ sơ, trạng thái hoạt động và lịch phân công của tài xế.
- Tài xế xem nhiệm vụ, xác nhận nhận việc và cập nhật kết quả.
- Ghi nhận Eco-Point và lịch sử giao dịch điểm.
- Danh mục phần thưởng, tồn kho phần thưởng và yêu cầu đổi thưởng.
- Thông báo trong hệ thống khi trạng thái thay đổi.
- Dashboard quản trị với số liệu vận hành cơ bản.

### 3.2. Ngoài phạm vi MVP

- Thanh toán tiền mặt tự động hoặc tích hợp API đổi voucher với đối tác bên ngoài.
- ESG Dashboard và báo cáo ESG chuyên sâu cho doanh nghiệp.
- Green Passport với huy hiệu, cấp độ và ước tính tác động môi trường chi tiết.
- Theo dõi vị trí tài xế theo thời gian thực.
- AI tự động gom cụm và tối ưu tuyến đường hoàn chỉnh.
- Tích hợp trực tiếp hệ thống của cơ sở tái chế.
- Thanh toán trực tuyến, đấu giá hoặc mua bán e-waste.

Các chức năng ngoài phạm vi có thể được phát triển sau khi MVP chứng minh được nhu cầu và tính khả thi vận hành.

## 4. Tác nhân và quyền hạn

| Tác nhân | Mô tả | Quyền chính |
|---|---|---|
| Người dùng | Cá nhân, hộ gia đình hoặc đại diện tổ chức | Quản lý tài khoản; tạo, xem và hủy yêu cầu; theo dõi trạng thái; xem Eco-Point và đổi phần thưởng |
| Quản trị viên | Nhân sự vận hành GreenCycle | Quản lý yêu cầu, lịch, tài xế, Eco-Point, kho phần thưởng, danh mục e-waste và dashboard |
| Tài xế | Nhân sự/đối tác thực hiện thu gom | Xem nhiệm vụ được giao; xác nhận nhận việc; cập nhật trạng thái và kết quả thực tế |
| Đối tác tái chế | Cơ sở tiếp nhận và xử lý e-waste | Trong MVP, xác nhận tiếp nhận được quản trị viên nhập thay trên hệ thống |

## 5. Yêu cầu chức năng

### 5.1. Tài khoản và xác thực

- **FR-01:** Người dùng đăng ký bằng họ tên, email, số điện thoại và mật khẩu.
- **FR-02:** Email và số điện thoại phải là duy nhất.
- **FR-03:** Người dùng đăng nhập, đăng xuất và duy trì phiên đăng nhập an toàn.
- **FR-04:** Hệ thống phân quyền theo vai trò Người dùng, Quản trị viên và Tài xế.
- **FR-05:** Người dùng có thể cập nhật hồ sơ và địa chỉ mặc định.

### 5.2. Yêu cầu thu gom

- **FR-06:** Người dùng tạo yêu cầu gồm loại e-waste, số lượng/khối lượng ước tính, địa chỉ, ngày giờ mong muốn, ghi chú và ảnh tùy chọn.
- **FR-07:** Hệ thống kiểm tra địa chỉ có thuộc khu vực phục vụ của MVP hay không.
- **FR-08:** Hệ thống hiển thị Eco-Point dự kiến dựa trên thông tin khai báo; giá trị này không phải phần thưởng cuối cùng.
- **FR-09:** Người dùng xem danh sách và chi tiết các yêu cầu của mình.
- **FR-10:** Người dùng chỉ được sửa hoặc hủy yêu cầu trước khi quản trị viên xác nhận lịch.
- **FR-11:** Hệ thống lưu lịch sử thay đổi trạng thái và thời gian cập nhật.

### 5.3. Lập lịch và phân công

- **FR-12:** Quản trị viên xem và lọc yêu cầu theo ngày, khu vực và trạng thái.
- **FR-13:** Quản trị viên duyệt hoặc từ chối yêu cầu; khi từ chối phải nhập lý do.
- **FR-14:** Quản trị viên tạo lịch thu gom và gán một tài xế khả dụng.
- **FR-15:** MVP hỗ trợ quản trị viên nhóm thủ công các yêu cầu gần nhau thành một đợt thu gom.
- **FR-16:** Hệ thống không cho phép phân công trùng thời gian đối với cùng một tài xế.

### 5.4. Thu gom và xác minh

- **FR-17:** Tài xế xem các nhiệm vụ được phân công và thông tin cần thiết để thu gom.
- **FR-18:** Tài xế cập nhật các mốc: đã nhận nhiệm vụ, đang đến lấy, đã thu gom hoặc thu gom thất bại.
- **FR-19:** Khi thu gom, tài xế nhập loại, số lượng/khối lượng thực tế và ảnh xác nhận nếu cần.
- **FR-20:** Nếu thu gom thất bại, tài xế phải chọn hoặc nhập lý do.
- **FR-21:** Quản trị viên xác nhận e-waste đã được bàn giao cho đối tác tái chế.

### 5.5. Eco-Point

- **FR-22:** Hệ thống tính Eco-Point cuối cùng từ loại và số lượng/khối lượng đã xác minh.
- **FR-23:** Eco-Point chỉ được cộng một lần sau khi yêu cầu hoàn tất.
- **FR-24:** Người dùng xem số dư và lịch sử cộng/trừ điểm.
- **FR-25:** Quản trị viên có thể điều chỉnh điểm; mọi điều chỉnh phải có lý do và được lưu nhật ký.

### 5.6. Thông báo và dashboard

- **FR-26:** Hệ thống tạo thông báo khi yêu cầu được duyệt, lên lịch, phân công, thu gom, thất bại, hoàn tất hoặc bị hủy.
- **FR-27:** Dashboard hiển thị tối thiểu: tổng yêu cầu, yêu cầu theo trạng thái, tổng lượng e-waste đã thu gom và tổng Eco-Point đã cấp.

### 5.7. Quản trị tài xế

- **FR-28:** Quản trị viên tạo tài khoản tài xế với họ tên, số điện thoại, email, loại phương tiện và biển số xe.
- **FR-29:** Quản trị viên xem, tìm kiếm và cập nhật hồ sơ tài xế.
- **FR-30:** Quản trị viên đặt trạng thái tài xế là `ACTIVE`, `INACTIVE` hoặc `SUSPENDED`.
- **FR-31:** Quản trị viên xem lịch phân công và các nhiệm vụ hiện tại của từng tài xế.
- **FR-32:** Quản trị viên có thể đổi tài xế trước khi yêu cầu chuyển sang `EN_ROUTE`; hệ thống phải thông báo cho các tài xế liên quan.
- **FR-33:** Hệ thống thống kê số nhiệm vụ được giao, hoàn tất và thất bại của từng tài xế.

### 5.8. Kho phần thưởng và đổi thưởng

- **FR-34:** Quản trị viên tạo, xem, cập nhật và ngừng cung cấp phần thưởng.
- **FR-35:** Mỗi phần thưởng gồm tên, mô tả, hình ảnh, số Eco-Point cần đổi, số lượng tồn kho và thời hạn sử dụng nếu có.
- **FR-36:** Người dùng xem danh sách phần thưởng đang hoạt động và còn hàng.
- **FR-37:** Người dùng gửi yêu cầu đổi thưởng khi đủ điểm và phần thưởng còn tồn kho.
- **FR-38:** Khi đổi thưởng hợp lệ, hệ thống đồng thời trừ Eco-Point, giảm tồn kho và tạo đơn đổi thưởng.
- **FR-39:** Người dùng xem lịch sử và trạng thái đơn đổi thưởng.
- **FR-40:** Quản trị viên xác nhận đơn đổi thưởng ở các trạng thái chờ xử lý, đã xác nhận, đã giao/nhận hoặc đã hủy.
- **FR-41:** Quản trị viên được điều chỉnh tồn kho thủ công; mỗi điều chỉnh phải có số lượng, lý do và người thực hiện.
- **FR-42:** Hệ thống tạo cảnh báo khi tồn kho phần thưởng bằng hoặc thấp hơn ngưỡng cảnh báo.

## 6. Quy tắc nghiệp vụ

| Mã | Quy tắc |
|---|---|
| BR-02 | Yêu cầu phải có ít nhất một loại e-waste và số lượng hoặc khối lượng lớn hơn 0. |
| BR-03 | Ngày giờ mong muốn phải thuộc khung giờ hoạt động và không nằm trong quá khứ. |
| BR-04 | Eco-Point hiển thị khi tạo yêu cầu chỉ là ước tính. Điểm cuối cùng dựa trên kết quả xác minh thực tế. |
| BR-05 | Người dùng chỉ được sửa/hủy khi yêu cầu ở trạng thái `PENDING_REVIEW`. |
| BR-06 | Chỉ quản trị viên được duyệt, từ chối, lập lịch, phân công và xác nhận hoàn tất. |
| BR-07 | Chỉ tài xế được phân công hoặc quản trị viên mới được cập nhật kết quả thu gom. |
| BR-08 | Một yêu cầu chỉ được gán cho một tài xế tại một thời điểm. |
| BR-09 | Không được chuyển sang `COLLECTED` nếu chưa có số lượng/khối lượng thực tế. |
| BR-10 | Yêu cầu chỉ hoàn tất sau khi quản trị viên xác nhận đối tác tái chế đã tiếp nhận. |
| BR-11 | Mỗi yêu cầu chỉ phát sinh một giao dịch cộng Eco-Point hoàn tất; thao tác phải có tính chống trùng lặp. |
| BR-12 | Yêu cầu bị từ chối, bị hủy hoặc thu gom thất bại không được cộng Eco-Point. |
| BR-13 | Mọi thay đổi trạng thái, phân công và điều chỉnh điểm phải được ghi nhật ký. |
| BR-14 | Dữ liệu cá nhân và ảnh chỉ được truy cập bởi người dùng sở hữu và nhân sự có quyền xử lý. |
| BR-15 | Chỉ tài xế có trạng thái `ACTIVE` mới được phân công nhiệm vụ mới. |
| BR-16 | Không được khóa hoặc vô hiệu hóa tài xế đang thực hiện nhiệm vụ `EN_ROUTE`; quản trị viên phải xử lý hoặc chuyển nhiệm vụ trước. |
| BR-17 | Email và số điện thoại của tài xế phải là duy nhất trong hệ thống. |
| BR-18 | Phần thưởng chỉ hiển thị để đổi khi đang hoạt động, còn hạn và tồn kho lớn hơn 0. |
| BR-19 | Người dùng chỉ đổi thưởng khi số dư Eco-Point lớn hơn hoặc bằng số điểm yêu cầu. |
| BR-20 | Trừ điểm và giảm tồn kho phải được thực hiện trong cùng một giao dịch; nếu một bước thất bại, toàn bộ thao tác phải được hoàn tác. |
| BR-21 | Hệ thống không được để tồn kho phần thưởng hoặc số dư Eco-Point nhỏ hơn 0. |
| BR-22 | Mỗi yêu cầu đổi thưởng phải có mã duy nhất để ngăn gửi hoặc xử lý trùng lặp. |
| BR-23 | Khi quản trị viên hủy đơn trước khi hoàn tất, hệ thống hoàn lại điểm và tồn kho đúng một lần. |
| BR-24 | Đơn đã ở trạng thái `FULFILLED` không được hủy trên luồng thông thường. |
| BR-25 | Mọi thay đổi hồ sơ/trạng thái tài xế, tồn kho và đơn đổi thưởng phải được ghi nhật ký. |

> **Cấu hình vận hành:** Bảng quy đổi Eco-Point, mức tối thiểu nhận thu gom, khung giờ hoạt động và giới hạn năng lực tài xế nên được quản trị viên cấu hình thay vì viết cố định trong mã nguồn.

## 7. Vòng đời yêu cầu thu gom

| Trạng thái | Ý nghĩa | Tác nhân cập nhật |
|---|---|---|
| `PENDING_REVIEW` | Yêu cầu mới, đang chờ kiểm tra | Hệ thống |
| `REJECTED` | Yêu cầu không được tiếp nhận | Quản trị viên |
| `SCHEDULED` | Yêu cầu đã được duyệt và có lịch | Quản trị viên |
| `ASSIGNED` | Đã phân công tài xế | Quản trị viên |
| `EN_ROUTE` | Tài xế đang đến địa điểm | Tài xế |
| `COLLECTED` | E-waste đã được lấy và xác minh sơ bộ | Tài xế/Quản trị viên |
| `RECYCLING_CONFIRMED` | Đối tác tái chế đã tiếp nhận | Quản trị viên |
| `COMPLETED` | Đã chốt điểm và hoàn tất giao dịch | Hệ thống |
| `FAILED` | Không thể thu gom | Tài xế/Quản trị viên |
| `CANCELLED` | Người dùng hoặc quản trị viên hủy hợp lệ | Người dùng/Quản trị viên |

Luồng hợp lệ chính:

```text
PENDING_REVIEW → SCHEDULED → ASSIGNED → EN_ROUTE → COLLECTED
→ RECYCLING_CONFIRMED → COMPLETED
```

Luồng ngoại lệ:

- `PENDING_REVIEW → REJECTED`
- `PENDING_REVIEW → CANCELLED`
- `ASSIGNED/EN_ROUTE → FAILED`

## 8. Workflow chính

### WF-01 — Đăng ký và đăng nhập

1. Người dùng nhập thông tin đăng ký.
2. Hệ thống kiểm tra dữ liệu và tính duy nhất của email/số điện thoại.
3. Hệ thống tạo tài khoản Người dùng.
4. Người dùng đăng nhập bằng email và mật khẩu.
5. Hệ thống xác thực, tạo phiên và chuyển đến trang tổng quan.

**Ngoại lệ:** Dữ liệu không hợp lệ, tài khoản đã tồn tại hoặc sai thông tin đăng nhập thì hệ thống hiển thị lỗi phù hợp và không tạo phiên.

### WF-02 — Tạo yêu cầu thu gom

1. Người dùng chọn loại e-waste và nhập số lượng/khối lượng ước tính.
2. Người dùng nhập địa chỉ, thời gian mong muốn, ghi chú và ảnh tùy chọn.
3. Hệ thống kiểm tra khu vực phục vụ và dữ liệu bắt buộc.
4. Hệ thống tính Eco-Point dự kiến.
5. Người dùng xác nhận gửi.
6. Hệ thống tạo yêu cầu ở trạng thái `PENDING_REVIEW` và thông báo đã tiếp nhận.

### WF-03 — Duyệt, lập lịch và phân công

1. Quản trị viên xem yêu cầu đang chờ.
2. Quản trị viên kiểm tra địa chỉ, loại e-waste, khối lượng và thời gian.
3. Nếu không hợp lệ, quản trị viên từ chối và nhập lý do.
4. Nếu hợp lệ, quản trị viên chọn ngày giờ thu gom và chuyển sang `SCHEDULED`.
5. Quản trị viên có thể nhóm các yêu cầu gần nhau thành một đợt.
6. Quản trị viên chọn tài xế khả dụng và phân công.
7. Hệ thống chuyển yêu cầu sang `ASSIGNED` và thông báo cho người dùng, tài xế.

### WF-04 — Thu gom

1. Tài xế mở danh sách nhiệm vụ và xác nhận nhận việc.
2. Khi bắt đầu di chuyển, tài xế cập nhật `EN_ROUTE`.
3. Tại địa điểm, tài xế đối chiếu e-waste thực tế với khai báo.
4. Tài xế nhập loại, số lượng/khối lượng thực tế và bằng chứng cần thiết.
5. Nếu thành công, yêu cầu chuyển sang `COLLECTED`.
6. Nếu không thành công, tài xế cập nhật `FAILED` và lý do.
7. Hệ thống thông báo kết quả cho người dùng và quản trị viên.

### WF-05 — Xác nhận tái chế và cộng Eco-Point

1. E-waste đã thu gom được chuyển đến điểm phân loại và đối tác tái chế.
2. Sau khi nhận xác nhận từ đối tác, quản trị viên cập nhật `RECYCLING_CONFIRMED`.
3. Hệ thống tính Eco-Point cuối cùng theo dữ liệu thực tế.
4. Hệ thống tạo một giao dịch cộng điểm và cập nhật số dư.
5. Hệ thống chuyển yêu cầu sang `COMPLETED`.
6. Người dùng nhận thông báo và xem lịch sử tái chế/điểm thưởng.

### WF-06 — Hủy yêu cầu

1. Người dùng mở yêu cầu ở trạng thái `PENDING_REVIEW`.
2. Người dùng chọn hủy và xác nhận.
3. Hệ thống chuyển trạng thái sang `CANCELLED` và ghi nhật ký.
4. Với yêu cầu đã lên lịch, người dùng phải liên hệ GreenCycle; chỉ quản trị viên có thể quyết định hủy hoặc đổi lịch.

### WF-07 — Quản trị tài xế

1. Quản trị viên tạo hồ sơ và tài khoản đăng nhập cho tài xế.
2. Hệ thống kiểm tra tính duy nhất của email, số điện thoại và dữ liệu phương tiện.
3. Quản trị viên đặt tài xế ở trạng thái `ACTIVE` khi đủ điều kiện hoạt động.
4. Khi phân công, hệ thống chỉ hiển thị các tài xế đang hoạt động và không trùng lịch.
5. Quản trị viên xem lịch, nhiệm vụ và kết quả thực hiện của từng tài xế.
6. Khi tài xế tạm nghỉ hoặc vi phạm, quản trị viên chuyển sang `INACTIVE` hoặc `SUSPENDED` sau khi xử lý các nhiệm vụ đang thực hiện.

### WF-08 — Quản lý kho phần thưởng

1. Quản trị viên tạo phần thưởng, nhập giá đổi bằng Eco-Point, tồn kho ban đầu và thời hạn.
2. Quản trị viên kích hoạt phần thưởng để hiển thị cho người dùng.
3. Khi nhập thêm, mất, hỏng hoặc điều chỉnh hàng, quản trị viên tạo phiếu điều chỉnh tồn kho kèm lý do.
4. Hệ thống cập nhật tồn kho và lưu lịch sử biến động.
5. Khi số lượng chạm ngưỡng cảnh báo, hệ thống gửi cảnh báo cho quản trị viên.
6. Phần thưởng hết hàng, hết hạn hoặc bị ngừng cung cấp sẽ không thể tạo đơn đổi mới.

### WF-09 — Người dùng đổi phần thưởng

1. Người dùng chọn một phần thưởng đang hoạt động và còn hàng.
2. Hệ thống kiểm tra số dư điểm, tồn kho, thời hạn và trạng thái phần thưởng.
3. Người dùng xác nhận đổi và cung cấp thông tin nhận thưởng nếu cần.
4. Trong cùng một giao dịch, hệ thống trừ điểm, giảm tồn kho và tạo đơn ở trạng thái `PENDING`.
5. Quản trị viên xác nhận và chuẩn bị phần thưởng, chuyển đơn sang `CONFIRMED`.
6. Khi người dùng đã nhận, quản trị viên chuyển đơn sang `FULFILLED`.
7. Nếu đơn bị hủy hợp lệ trước khi hoàn tất, hệ thống hoàn lại điểm và tồn kho đúng một lần.

## 9. Mô hình dữ liệu tối thiểu

| Thực thể | Thuộc tính chính |
|---|---|
| `User` | id, fullName, email, phone, passwordHash, role, status, createdAt |
| `Address` | id, userId, addressLine, ward, district, latitude, longitude, isDefault |
| `WasteCategory` | id, name, unit, pointRate, active |
| `PickupRequest` | id, userId, addressId, preferredTime, status, note, estimatedPoints, finalPoints, createdAt |
| `PickupItem` | id, requestId, categoryId, estimatedQuantity, actualQuantity, unit |
| `PickupImage` | id, requestId, imageUrl, imageType |
| `PickupBatch` | id, scheduledStart, scheduledEnd, status, driverId |
| `BatchRequest` | batchId, requestId, sequence |
| `DriverProfile` | id, userId, availabilityStatus, vehicleInfo |
| `DriverAssignment` | id, driverId, requestId/batchId, assignedAt, status |
| `StatusHistory` | id, requestId, fromStatus, toStatus, changedBy, reason, changedAt |
| `PointTransaction` | id, userId, requestId, type, amount, reason, createdAt |
| `Reward` | id, name, description, imageUrl, pointsCost, stockQuantity, lowStockThreshold, expiresAt, status |
| `RewardRedemption` | id, userId, rewardId, quantity, pointsSpent, status, fulfillmentInfo, createdAt |
| `RewardInventoryTransaction` | id, rewardId, redemptionId, type, quantityChange, reason, changedBy, createdAt |
| `Notification` | id, userId, title, content, readAt, createdAt |

## 10. Yêu cầu phi chức năng

- **NFR-01 — Responsive:** Hoạt động tốt trên máy tính và điện thoại phổ biến.
- **NFR-02 — Hiệu năng:** Các thao tác thông thường phản hồi trong khoảng 3 giây ở điều kiện mạng ổn định.
- **NFR-03 — Bảo mật:** Mật khẩu được băm; kết nối dùng HTTPS khi triển khai; API kiểm tra xác thực và phân quyền.
- **NFR-04 — Riêng tư:** Chỉ thu thập dữ liệu cần thiết; hạn chế truy cập địa chỉ, số điện thoại và ảnh.
- **NFR-05 — Tin cậy:** Cập nhật trạng thái, cộng/trừ điểm và thay đổi tồn kho phải nhất quán, có transaction và chống xử lý lặp.
- **NFR-06 — Truy vết:** Các thao tác quan trọng phải có nhật ký người thực hiện và thời gian.
- **NFR-07 — Khả dụng:** Form có nhãn rõ ràng, thông báo lỗi cụ thể và hỗ trợ thao tác bàn phím cơ bản.
- **NFR-08 — Sao lưu:** Dữ liệu vận hành được sao lưu định kỳ và có quy trình khôi phục.

## 11. Tiêu chí chấp nhận MVP

- Người dùng có thể đăng ký, đăng nhập và tạo yêu cầu hợp lệ tại Quận 5.
- Người dùng thấy Eco-Point dự kiến trước khi gửi yêu cầu.
- Quản trị viên có thể duyệt, lên lịch và phân công tài xế mà không bị trùng lịch.
- Quản trị viên có thể tạo, cập nhật, khóa và xem lịch/nhiệm vụ của tài xế.
- Tài xế không hoạt động hoặc bị đình chỉ không thể nhận nhiệm vụ mới.
- Tài xế có thể cập nhật đầy đủ kết quả thu gom trên thiết bị di động.
- Người dùng theo dõi được mọi trạng thái quan trọng của yêu cầu.
- Yêu cầu hoàn tất chỉ được cộng Eco-Point đúng một lần.
- Yêu cầu thất bại, bị từ chối hoặc bị hủy không phát sinh điểm.
- Dashboard hiển thị đúng số liệu cơ bản của chương trình thí điểm.
- Mọi chuyển trạng thái và điều chỉnh điểm đều có lịch sử kiểm tra.
- Người dùng đủ điểm có thể đổi phần thưởng còn hàng; điểm và tồn kho được cập nhật nguyên tử.
- Đơn đổi thưởng bị hủy hợp lệ được hoàn điểm và tồn kho đúng một lần.
- Quản trị viên theo dõi được tồn kho, lịch sử điều chỉnh và cảnh báo sắp hết hàng.

## 12. Chỉ số đánh giá chương trình thí điểm

- Số người dùng đăng ký và tỷ lệ tạo yêu cầu đầu tiên.
- Số yêu cầu được tạo, duyệt, hoàn tất, thất bại và hủy.
- Thời gian trung bình từ lúc tạo yêu cầu đến lúc thu gom.
- Tỷ lệ thu gom thành công.
- Tổng số lượng/khối lượng e-waste thu gom.
- Chi phí và số yêu cầu trung bình trên mỗi đợt thu gom.
- Số nhiệm vụ và tỷ lệ hoàn tất theo từng tài xế.
- Số đơn đổi thưởng, tỷ lệ hoàn tất và các phần thưởng phổ biến.
- Tổng Eco-Point đã sử dụng và tỷ lệ phần thưởng hết hàng.
- Tỷ lệ người dùng quay lại tạo yêu cầu mới.
- Mức độ hài lòng và mức độ tin tưởng vào tính minh bạch của dịch vụ.

## 13. Hướng phát triển sau MVP

Sau giai đoạn thí điểm, GreenCycle có thể mở rộng sang tích hợp đổi voucher tự động với đối tác, Green Passport nâng cao, ESG Dashboard, tích hợp cơ sở tái chế, định vị thời gian thực và AI gom cụm/tối ưu tuyến tự động. Việc ưu tiên phát triển dựa trên dữ liệu sử dụng, chi phí vận hành và phản hồi người dùng thu được từ MVP.
