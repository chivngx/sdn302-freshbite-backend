# FreshBite Backend (SDN302)

RESTful API backend for **FreshBite Coffee & Bakery (Da Nang)** – an Order Ahead & Pick-up system serving React Native and Flutter mobile clients.

## Team & Contribution (20% Each)

- **Lê Đức Sơn (Nhóm trưởng):** Operations & Live Chat Lead (Live Chat CSKH 2 chiều, Reviews đánh giá, Báo cáo ca quầy Barista).
- **Nguyễn Chí Vương:** API Architect / Auth & Security Lead (Thiết kế RESTful API, Module Auth JWT/Bcrypt, Module Favorites, Postman Test Suite).
- **Nguyễn Xuân Thịnh:** BE Core Lead / Product & Orders (Express Server, CRUD Categories/Products/Orders, Server-side Pricing, Deep Population).
- **Nguyễn Đắc Thịnh:** Branches & Vouchers & Error Handling (API 4 Chi nhánh Đà Nẵng GPS, Quản lý Tồn kho outOfStock, Module Vouchers, Error Middleware, Logger).
- **Lê Tự Nhật Thạch:** Uploads, Seed Data & Web Admin SSR (Multer upload tĩnh `/uploads`, 3 Script Seed Data, Giao diện EJS Web Admin KDS Barista).

## Tech Stack

- **Runtime & Framework:** Node.js, Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Security:** JWT (Stateless Bearer Token), Bcrypt (Salt 10), Helmet, CORS
- **Template Engine:** EJS (Web Admin KDS Barista)
- **Validation:** Express-Validator
- **Package Manager:** `pnpm` / `npm`

## Getting Started

```bash
# 1. Install dependencies
pnpm install
# hoặc: npm install

# 2. Setup environment variables (add your MongoDB Atlas URI)
cp .env.example .env

# 3. Seed initial database (users & test products & branches)
pnpm run seed
# hoặc: npm run seed

# 4. Start development server
pnpm run dev
# hoặc: npm run dev
```

Server runs at `http://localhost:5000`.

## Project Structure

```text
sdn302-freshbite-backend/
├── config/             # Database connection (db.js)
├── controllers/        # Route controllers (auth, category, product, order, branch, voucher, chat, review, report)
├── middlewares/        # Auth (JWT), Validation, Error handlers, Logger
├── models/             # Mongoose schemas (User, Product, Order, Branch, Category, Voucher, Review, Message)
├── routes/             # API routes
├── seeds/              # Database seed scripts
├── docs/               # Postman collection test suite
├── tests/              # Automated test suites
├── server.js           # App entry point
└── package.json
```

## API Endpoints (Auth & Favorites Module)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Server health check |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản khách hàng / admin mới |
| `POST` | `/api/auth/login` | Public | Đăng nhập & nhận JWT Bearer Token (7 ngày) |
| `GET` | `/api/auth/me` | Bearer Token | Lấy thông tin user hiện tại (kèm favoriteProducts) |
| `PUT` | `/api/auth/profile` | Bearer Token | Cập nhật họ tên, số điện thoại, avatar |
| `PUT` | `/api/auth/change-password` | Bearer Token | Đổi mật khẩu tài khoản |
| `GET` | `/api/users/favorites` | Bearer Token | Lấy danh sách món ăn đã lưu yêu thích |
| `POST` | `/api/users/favorites/:productId` | Bearer Token | Thêm món ăn vào danh sách yêu thích ($addToSet) |
| `DELETE` | `/api/users/favorites/:productId` | Bearer Token | Xóa món ăn khỏi danh sách yêu thích ($pull) |

## API Endpoints (Branches Module - Da Nang Stores)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/branches` | Public | Lấy danh sách 4 chi nhánh Đà Nẵng (hỗ trợ `?district=...`, `?search=...`, `?userLat=...&userLng=...` tính khoảng cách GPS) |
| `GET` | `/api/branches/:id` | Public | Xem chi tiết 1 chi nhánh Đà Nẵng |
| `POST` | `/api/branches` | Admin | Tạo mới chi nhánh (kèm validation tọa độ GPS, số điện thoại, quận ĐN) |
| `PUT` | `/api/branches/:id` | Admin | Cập nhật thông tin chi nhánh |
| `DELETE` | `/api/branches/:id` | Admin | Xóa chi nhánh (tự động chuyển sang `isActive: false` nếu đã có đơn hàng) |

## Middlewares & System Utilities

- **Global Error Handling (`middlewares/errorMiddleware.js`):** Xử lý toàn cục 404 Not Found, Mongoose CastError (ObjectId), Mongoose ValidationError, Unique Index Conflict (11000), JWT Token Expired / Invalid, Multer upload errors, Express SyntaxError.
- **Request & Error Logger (`middlewares/loggerMiddleware.js`):** Ghi log HTTP request với mã màu ANSI trực quan (2xx xanh lá, 3xx cyan, 4xx vàng, 5xx đỏ), đo thời gian xử lý (ms), timestamp và ghi nhận lỗi hệ thống.

## Testing & Quality Assurance

### 1. Automated Test Suite (35 Scenarios)
Chạy bộ kiểm thử tự động toàn diện dành cho các module của **Nguyễn Đắc Thịnh**:
```bash
npm test
```
Đạt chuẩn `35/35 PASSED` gồm:
- 15 test cases cho Module Chi nhánh Đà Nẵng (CRUD, Lọc quận, Tìm kiếm, Tọa độ GPS & Thuật toán Haversine).
- 7 test cases cho Bảo mật & Phân quyền Admin (HTTP 401 Unauthorized, HTTP 403 Forbidden).
- 9 test cases cho Middleware Bắt lỗi toàn cục (HTTP 400 Bad Request, HTTP 404 Not Found, HTTP 500 Internal Server Error, JSON SyntaxError).
- 4 test cases cho Logger Middleware.

### 2. Postman Collection Test Suite
Import `docs/FreshBite_DaNang_API.postman_collection.json` vào Postman. Bộ kịch bản bao gồm:
- `0. Automated Test Runner (16 Scenarios - Full Flow)`
- `1. Authentication & Security (Nguyen Chi Vuong)`
- `2. Favorites Module (Nguyen Chi Vuong)`
- `3. Products & Categories (Nguyen Xuan Thinh)`
- `4. Orders & KDS (Pick-up) (Nguyen Xuan Thinh)`
- `5. Branches - Da Nang Stores (Nguyen Dac Thinh)`
- `6. Global Error Handling & HTTP Status Showcase (Nguyen Dac Thinh)`

Kiểm thử đầy đủ các mã HTTP (200, 201, 400, 401, 403, 404) phục vụ thuyết trình bảo vệ đồ án.
