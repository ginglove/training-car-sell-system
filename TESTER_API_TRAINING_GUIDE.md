# 🚗 Hướng Dẫn Kiểm Thử API & Tài Liệu Swagger UI Cho QA/Tester
> **Hệ Thống Phân Phối Ô Tô Đa Chi Nhánh (AutoDealership Enterprise Platform v25.0)**  
> Dành cho Đội ngũ QA / Tester / Automation Test phục vụ đào tạo và nghiệm thu hệ thống.

---

## 1. Cách Truy Cập Swagger UI & Tài Liệu API

Hệ thống cung cấp **3 cách** để Tester mở và tương tác với Swagger UI:

| Cách | Địa chỉ truy cập | Ghi chú |
| :--- | :--- | :--- |
| **Cách 1: Trực tiếp qua Next.js App** | `http://localhost:3000/api-docs` | Tích hợp sẵn trong ứng dụng web (hoặc trên link Vercel) |
| **Cách 2: Static URL trên Server** | `http://localhost:3000/api-docs.html` hoặc `/swagger.html` | File HTML độc lập được phục vụ từ thư mục `public/` |
| **Cách 3: Mở trực tiếp không cần bật Server** | Mở file `public/swagger.html` bằng trình duyệt bất kỳ (Chrome/Firefox/Edge) | Nhấp đúp chuột vào file `public/swagger.html` để xem offline |
| **Cách 4: Tải OpenAPI Spec JSON** | `public/openapi.json` | Dùng để Import vào **Postman**, **Insomnia**, hoặc **Katalon / JMeter** |

---

## 2. Thông Tin Tài Khoản Mẫu (Test Personas) & Sandbox OTP

Tất cả tài khoản trong hệ thống đều dùng chung mật khẩu mặc định: **`Admin@123`**  
Mã OTP Sandbox cho mọi số điện thoại: **`888888`**

| STT | Role | Họ và Tên | Email / Username | Số Điện Thoại | Phạm Vi (Scope) & Thẩm Quyền |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | **ADMIN** | Nguyễn Văn Admin | `admin@autodealer.vn` | `0900000001` | Toàn quyền hệ thống, cấu hình trần chiết khấu, xem audit logs, giải mã PII CCCD |
| 2 | **MANAGER** | Trần Thị Manager HN | `manager.hn@autodealer.vn` | `0900000002` | Quản lý Showroom Cầu Giấy (Duyệt cọc, giữ VIN 24h, điều chuyển kho) |
| 3 | **MANAGER** | Lê Văn Manager HCM | `manager.hcm@autodealer.vn` | `0900000003` | Quản lý Showroom Quận 7 - TP.HCM |
| 4 | **SALE** | Phạm Văn Sale HN 1 | `sale1@autodealer.vn` | `0900000004` | Quản lý Leads CRM showroom Cầu Giấy, đặt lịch lái thử, gửi Paylink |
| 5 | **SALE** | Vũ Văn Sale HCM | `sale3@autodealer.vn` | `0900000006` | Quản lý Leads CRM showroom Quận 7 |
| 6 | **CUSTOMER** | Nguyễn Văn Tuấn | `customer1@gmail.com` | `0912345678` | Khách mua xe: đặt cọc xe, nộp hồ sơ vay ngân hàng, đổi xe cũ |
| 7 | **CUSTOMER** | Trần Thị Minh Hương | `customer2@gmail.com` | `0988776655` | Khách mua xe mới |

---

## 3. Hướng Dẫn Xác Thực (Authentication) & Khắc Phục Lỗi CORS

### ⚠️ Lưu Ý Quan Trọng Về Lỗi CORS "Failed to fetch":
Nếu bạn gặp thông báo:
```
Failed to fetch. Possible Reasons: CORS, Network Failure, URL scheme must be "http" or "https" for CORS request.
```
Nguyên nhân là do bạn đang nhấp đúp mở file `public/swagger.html` trực tiếp bằng giao thức **`file:///`** (Local File) trên máy. Trình duyệt sẽ chặn không cho giao thức `file:///` gọi API tới `https://training-car-sell-system.vercel.app` hoặc `http://localhost:3000`.

👉 **Cách khắc phục triệt để:**
- Khi test Local: Mở qua **`http://localhost:3000/api-docs`** hoặc `http://localhost:3000/swagger.html`.
- Khi test trên Vercel: Mở qua **`https://training-car-sell-system.vercel.app/api-docs`** hoặc `https://training-car-sell-system.vercel.app/swagger.html`.

---

### Các Cách Đăng Nhập (Login) Dành Cho Tester:

#### Cách 1: Sử dụng REST API chuẩn `POST /api/v1/auth/login` (Khuyên dùng cho Swagger / cURL / Postman)
- **Endpoint**: `POST /api/v1/auth/login`
- **Headers**: `Content-Type: application/json`
- **Request Body mẫu**:
  ```json
  {
    "identity": "admin@autodealer.vn",
    "password": "Admin@123",
    "mode": "password"
  }
  ```
  *(Hoặc đăng nhập bằng OTP: `"identity": "0900000001"`, `"otp": "888888"`, `"mode": "otp"`)*
- **Response trả về**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Đăng nhập thành công",
      "token": "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0...",
      "user": {
        "id": "...",
        "email": "admin@autodealer.vn",
        "role": "ADMIN",
        "showroomId": "..."
      }
    }
  }
  ```
- **Cách dùng Token**: Copy chuỗi `data.token` &rarr; Nhấn nút **Authorize 🔒** góc trên bên phải trong Swagger UI &rarr; Dán vào ô **Value** của `bearerAuth` &rarr; Nhấn **Authorize**. Giờ đây bạn có thể "Try it out" mọi API được phân quyền!

#### Cách 2: Đăng nhập giao diện Web để tự động lấy Cookie
1. Truy cập trang web: `http://localhost:3000/login` (hoặc trên Vercel).
2. Đăng nhập với email và mật khẩu.
3. Sau đó mở `http://localhost:3000/api-docs`. Trình duyệt sẽ tự động gửi kèm cookie `authjs.session-token` trong mọi request.

---

## 4. Ma Trận Phân Quyền (RBAC Matrix)

| STT | Nhóm Nghiệp Vụ | Endpoint | Phương Thức | ADMIN | MANAGER | SALE | CUSTOMER |
| :-: | :--- | :--- | :-: | :-: | :-: | :-: | :-: |
| 1 | Xác thực | `/api/auth/callback/credentials` | `POST` | ✅ | ✅ | ✅ | ✅ |
| 2 | Gửi mã OTP | `/api/v1/auth/otp/send` | `POST` | ✅ | ✅ | ✅ | ✅ (Public) |
| 3 | Đăng ký | `/api/v1/auth/register` | `POST` | ✅ | ✅ | ✅ | ✅ (Public) |
| 4 | Đặt lại mật khẩu | `/api/v1/auth/reset-password` | `POST` | ✅ | ✅ | ✅ | ✅ (Public) |
| 5 | Thông tin cá nhân | `/api/v1/users/profile` | `GET`, `PUT` | ✅ | ✅ | ✅ | ✅ |
| 6 | Đổi mật khẩu | `/api/v1/users/change-password` | `PUT` | ✅ | ✅ | ✅ | ✅ |
| 7 | Tra cứu xe | `/api/v1/catalog/models` | `GET` | ✅ | ✅ | ✅ | ✅ (Public) |
| 8 | Chi tiết biến thể | `/api/v1/catalog/variants/{id}` | `GET` | ✅ | ✅ | ✅ | ✅ (Public) |
| 9 | Showroom | `/api/v1/showrooms` | `GET` | ✅ | ✅ | ✅ | ✅ (Public) |
| 10 | Lịch lái thử | `/api/v1/test-drives/slots` | `GET` | ✅ | ✅ | ✅ | ✅ |
| 11 | Đặt hẹn lái thử | `/api/v1/test-drives/book` | `POST` | ✅ | ✅ | ✅ | ✅ |
| 12 | Đặt cọc xe | `/api/v1/orders/deposit` | `POST` | ✅ | ✅ | ✅ | ✅ |
| 13 | Đơn hàng của tôi | `/api/v1/orders/my` | `GET` | ✅ | ✅ | ✅ | ✅ |
| 14 | Chi tiết đơn cọc | `/api/v1/orders/{id}` | `GET` | ✅ | ✅ | ✅ | ✅ |
| 15 | Gửi Paylink | `/api/v1/orders/{id}/send-paylink` | `POST` | ✅ | ✅ | ✅ | ❌ (403) |
| 16 | Stream thanh toán | `/api/v1/payments/stream` | `GET` (SSE) | ✅ | ✅ | ✅ | ✅ |
| 17 | Mock Webhook | `/api/v1/payments/mock-webhook` | `POST` | ✅ | ✅ | ✅ | ✅ (Sandbox) |
| 18 | Đổi ngân hàng vay | `/api/v1/loans/{id}/switch-bank` | `POST` | ✅ | ✅ | ✅ | ✅ (Tối đa 3 lần) |
| 19 | Quyết định vay Mock | `/api/v1/mock/bank-decision` | `POST` | ✅ | ✅ | ✅ | ✅ (Sandbox) |
| 20 | Gửi định giá xe cũ | `/api/v1/trade-in/submit` | `POST` | ✅ | ✅ | ✅ | ✅ |
| 21 | Cập nhật Trade-in | `/api/v1/trade-in/{id}/status` | `PATCH` | ✅ | ✅ | ✅ | ❌ (403) |
| 22 | Xin hoàn cọc | `/api/v1/refunds/request` | `POST` | ✅ | ✅ | ✅ | ✅ |
| 23 | Duyệt hoàn cọc | `/api/v1/refunds/{id}/decision` | `POST` | ✅ (Tier 2) | ✅ (Tier 1) | ❌ (403) | ❌ (403) |
| 24 | Tồn kho VIN | `/api/v1/inventory/vehicles` | `GET` | ✅ | ✅ | ✅ (Showroom) | ❌ (403) |
| 25 | Khóa giữ VIN 24h | `/api/v1/inventory/manual-vin-hold` | `POST` | ✅ | ✅ | ❌ (403) | ❌ (403) |
| 26 | Danh sách chuyển kho | `/api/v1/inventory/transfers` | `GET` | ✅ | ✅ | ❌ (403) | ❌ (403) |
| 27 | Yêu cầu chuyển kho | `/api/v1/inventory/transfers` | `POST` | ✅ | ✅ | ❌ (403) | ❌ (403) |
| 28 | Báo cáo xe trầy xước | `/api/v1/inventory/transfers/{id}/damage-report` | `POST` | ✅ | ✅ | ❌ (403) | ❌ (403) |
| 29 | Danh sách CRM Leads | `/api/v1/crm/leads` | `GET` | ✅ (All) | ✅ (Showroom) | ✅ (Assigned) | ❌ (403) |
| 30 | Tạo CRM Lead | `/api/v1/crm/leads` | `POST` | ✅ | ✅ | ✅ | ❌ (403) |
| 31 | Chuyển stage Lead | `/api/v1/crm/leads/{id}/status` | `PATCH` | ✅ | ✅ | ✅ | ❌ (403) |
| 32 | Quản lý người dùng | `/api/v1/admin/users` | `GET`, `POST` | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| 33 | Cấu hình hệ thống | `/api/v1/system/configs` | `GET`, `PUT` | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| 34 | Nhật ký kiểm toán | `/api/v1/audit/logs` | `GET` | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| 35 | Giải mã PII CCCD | `/api/v1/audit/decrypt-pii` | `POST` | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |

---

## 5. Từ Điển Mã Lỗi (Error Matrix)

| Mã Lỗi | HTTP Code | Ý Nghĩa Nghiệp Vụ | Dữ Liệu Kích Hoạt Test (Negative Testing) |
| :--- | :-: | :--- | :--- |
| `ERR_REG_001` | 409 | Trùng Email hoặc SĐT khi đăng ký | Đăng ký với SĐT `0912345678` đã có trong hệ thống |
| `ERR_REG_002` | 400 | Sai mã OTP khi đăng ký | Gửi `otpCode` là `111111` thay vì `888888` |
| `ERR_REG_003` | 422 | Vi phạm chuẩn validation (Họ tên, SĐT VN, Password) | Tên 1 ký tự, SĐT không đúng 10 số đầu 03/05/07/08/09 |
| `ERR_UI_002` | 400 | Mật khẩu không đủ mạnh | Đặt mật khẩu không có ký tự đặc biệt hoặc &lt; 10 ký tự |
| `ERR_UI_003` | 401 | Mật khẩu hiện tại không chính xác | Đổi mật khẩu với mật khẩu cũ sai |
| `ERR_UI_004` | 401 | Khóa tài khoản tạm thời 30 phút | Thử đăng nhập sai mật khẩu 5 lần liên tục |
| `ERR_UI_005` | 400 | Mã OTP sai hoặc hết hạn | Nhập mã OTP khác `888888` |
| `ERR_UI_030` | 409 | Xung đột lịch hẹn lái thử | Đặt 2 lần vào cùng 1 `slotId` |
| `ERR_UI_031` | 400 | SĐT không đúng định dạng Việt Nam | Nhập `0123456789` (đầu số cố định cũ) |
| `ERR_UI_040` | 409 | Xe đã hết hàng trong kho showroom | Đặt cọc xe khi `available_count` = 0 |
| `ERR_UI_048` | 400 | Thông tin CCCD không đúng quy chuẩn 12 số | Nhập CCCD có 9 chữ số hoặc ngày cấp tương lai |
| `ERR_UI_049` | 409 | Số CCCD đã đăng ký trên tài khoản khác | Nhập CCCD `001200001234` đã thuộc về Customer 1 |
| `ERR_UI_051` | 400 | Vượt quá số lần đổi ngân hàng (Tối đa 3 lần) | Gọi `switch-bank` lần thứ 4 |
| `ERR_UI_060` | 400 | Thiếu các trường bắt buộc trong payload | Gửi body `{}` |
| `ERR_UI_070` | 400 | Thiếu văn bản từ chối cho vay của ngân hàng | Xin hoàn cọc do trượt vay nhưng không đính kèm file |
| `ERR_UI_071` | 400 | Đơn hoàn cọc đã được xử lý xong | Xin hoàn cọc lần 2 trên cùng 1 đơn |
| `ERR_UI_080` | 409 | Xe đã có người giữ chỗ (VIN hold conflict) | Khóa giữ VIN xe đang ở trạng thái `LOCKED` |
| `ERR_UI_090` | 400 | Vi phạm State Machine | Chuyển trạng thái nhảy cóc hoặc thiếu `lossReason` khi LOST |
| `ERR_UI_100` | 400 | Chiết khấu vượt trần quy định 10% | Cấu hình chiết khấu `maxDiscountPercentage: "12.00"` |
| `ERR_UI_101` | 403 | Không có quyền thực thi thao tác (Forbidden) | Dùng tài khoản SALE gọi API của ADMIN |

---

## 6. Hướng Dẫn 6 Kịch Bản Kiểm Thử Tích Hợp (End-to-End Test Scenarios)

### Kịch bản 1: Đăng ký khách hàng & Bảo mật thông tin CCCD
1. **Bước 1**: Gọi `POST /api/v1/auth/otp/send` với `{ "phone": "0987654321" }`.
   - *Kỳ vọng:* Status 200, nhận mã `sandboxCode: "888888"`.
2. **Bước 2**: Gọi `POST /api/v1/auth/register` với đầy đủ thông tin, mật khẩu phức tạp `TestCar@2026!` và OTP `888888`.
   - *Kỳ vọng:* Status 201, tài khoản mới được tạo.
3. **Bước 3**: Gọi `PUT /api/v1/users/profile` cập nhật số CCCD `079200009999` (12 chữ số).
   - *Kỳ vọng:* Status 200.
4. **Bước 4**: Gọi `GET /api/v1/users/profile`.
   - *Kỳ vọng:* Dữ liệu `identityCardMasked` hiển thị dạng `0792****9999`, không lộ CCCD gốc.
5. **Bước 5**: Dùng tài khoản ADMIN gọi `POST /api/v1/audit/decrypt-pii`.
   - *Kỳ vọng:* Status 200, giải mã CCCD gốc thành công và ghi nhận 1 bản ghi trong `GET /api/v1/audit/logs`.

### Kịch bản 2: Đặt cọc xe & Mô phỏng Thanh toán Webhook (Deposit Flow)
1. **Bước 1**: Gọi `POST /api/v1/orders/deposit` với `variantId` và `selectedColor: "Trắng"`.
   - *Kỳ vọng:* Status 201, trả về `orderId`, `orderCode`, `transactionRef`, trạng thái đơn là `PENDING_PAYMENT`. Quota xe trong kho được giữ bằng Soft Lock (`soft_locked_count + 1`).
2. **Bước 2**: Mở kết nối SSE qua `GET /api/v1/payments/stream?orderId={orderId}`.
   - *Kỳ vọng:* Stream trả về event `CONNECTED` rồi cập nhật trạng thái `PENDING`.
3. **Bước 3**: Giả lập cổng thanh toán thành công bằng Sandbox Tool:
   - Gọi `POST /api/v1/payments/mock-webhook` với:
     ```json
     {
       "transactionRef": "{transactionRef}",
       "result": "SUCCESS"
     }
     ```
   - *Kỳ vọng:* Status 200. Đơn hàng chuyển sang `DEPOSIT_PAID`, khoản thanh toán chuyển `SUCCESS`. Stream SSE nhận được event `SUCCESS`.

### Kịch bản 3: Quy trình Thẩm định Vay Ngân hàng & Đổi Đối Tác Vay
1. **Bước 1**: Tạo đơn hàng mua trả góp (`purchaseType: "INSTALLMENT"`).
2. **Bước 2**: Đổi ngân hàng lần 1 & 2 qua `POST /api/v1/loans/{id}/switch-bank` (ví dụ sang `TECHCOMBANK`, `VPBANK`).
   - *Kỳ vọng:* Status 200, trạng thái khoản vay chuyển thành `BANK_APPROVING`.
3. **Bước 3 (Negative Test)**: Gọi đổi ngân hàng lần thứ 4.
   - *Kỳ vọng:* Status 400, nhận mã lỗi `ERR_UI_051`.
4. **Bước 4**: Giả lập ngân hàng phê duyệt hồ sơ qua `POST /api/v1/mock/bank-decision` với `decision: "APPROVED"`.
   - *Kỳ vọng:* Status 200, hồ sơ vay chuyển `APPROVED`, đơn hàng chuyển sang trạng thái đã duyệt vay.

### Kịch bản 4: Thu cũ Đổi mới (Trade-In Lifecycle)
1. **Bước 1**: Khách hàng nộp xe cũ qua `POST /api/v1/trade-in/submit` (Hãng, dòng xe, ODO km, giá kỳ vọng).
   - *Kỳ vọng:* Status 201, trạng thái ban đầu là `SUBMITTED`.
2. **Bước 2**: Sale cập nhật kiểm định qua `PATCH /api/v1/trade-in/{id}/status` sang `APPRAISING`.
3. **Bước 3**: Showroom đưa ra giá thẩm định chính thức: chuyển sang `OFFERED` kèm `appraisedPrice: 450000000`.
4. **Bước 4**: Khách đồng ý (`ACCEPTED`) &rarr; Ký hợp đồng (`CONTRACT_SIGNED`) &rarr; Khấu trừ trực tiếp vào đơn cọc xe mới (`CREDITED_TO_ORDER`).
5. **Bước 5 (Negative Test)**: Thử cập nhật trạng thái sai quy tắc (ví dụ từ `SUBMITTED` nhảy thẳng sang `CREDITED_TO_ORDER`).
   - *Kỳ vọng:* Status 400, mã lỗi `ERR_UI_090`.

### Kịch bản 5: Quy trình Phê Duyệt Hoàn Cọc 2 Cấp (Governance)
1. **Bước 1**: Khách hàng yêu cầu hoàn cọc qua `POST /api/v1/refunds/request` kèm link chứng từ bị ngân hàng từ chối vay.
   - *Kỳ vọng:* Status 201, trạng thái khởi tạo `PENDING_MANAGER`.
2. **Bước 2**: Showroom Manager đăng nhập và duyệt Cấp 1 qua `POST /api/v1/refunds/{id}/decision` với `decision: "APPROVED"`.
   - *Kỳ vọng:* Status 200, trạng thái nâng lên `PENDING_ADMIN`.
3. **Bước 3**: Super Admin đăng nhập và duyệt Cấp 2 qua `POST /api/v1/refunds/{id}/decision` với `decision: "APPROVED"`.
   - *Kỳ vọng:* Status 200, trạng thái hoàn cọc thành `COMPLETED`, đơn hàng gốc tự động chuyển sang `REFUNDED`.

### Kịch bản 6: Quản lý Kho xe VIN & Báo cáo Hư Hỏng Vận Chuyển
1. **Bước 1**: Showroom Manager tra cứu xe trong kho qua `GET /api/v1/inventory/vehicles`.
2. **Bước 2**: Thực hiện giữ VIN 24h qua `POST /api/v1/inventory/manual-vin-hold`.
   - *Kỳ vọng:* Status 200, trạng thái xe thành `LOCKED`.
3. **Bước 3**: Yêu cầu chuyển xe sang showroom khác qua `POST /api/v1/inventory/transfers`.
   - *Kỳ vọng:* Status 201, trạng thái xe chuyển sang `TRANSFERRING`.
4. **Bước 4**: Báo cáo sự cố xe bị trầy xước lúc vận chuyển qua `POST /api/v1/inventory/transfers/{id}/damage-report`.
   - *Kỳ vọng:* Status 200, xe tự động bị cách ly thành `TRANSIT_DAMAGED` để chuyển vào xưởng sơn xử lý.

---

## 7. Hướng Dẫn Import Vào Postman Để Tự Động Hóa

1. Mở ứng dụng **Postman**.
2. Nhấn nút **Import** ở góc trên bên trái.
3. Chọn file `public/openapi.json` (hoặc dán đường link `http://localhost:3000/openapi.json`).
4. Postman sẽ tự động sinh ra một **Collection** hoàn chỉnh với:
   - 12 thư mục nghiệp vụ chuẩn.
   - 34 endpoints đã được định dạng sẵn Method, Headers, Query params, và Example JSON body.
   - Tự động cấu hình biến môi trường `{{baseUrl}}` = `http://localhost:3000`.
5. Bạn có thể sử dụng tính năng **Collection Runner** của Postman để chạy tự động toàn bộ 34 test cases chỉ trong vài giây!

---
*Tài liệu được biên soạn tự động từ hệ thống AutoDealership Enterprise Specification v25.0 Master.*
