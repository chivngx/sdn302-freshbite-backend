# FreshBite Backend (SDN302)

RESTful API backend for **FreshBite Coffee & Bakery (Da Nang)** – an Order Ahead & Pick-up system serving React Native and Flutter mobile clients.

## Team & Contribution (20% Each)

- **Nguyen Chi Vuong (FE Lead):** Project architecture, Authentication (JWT), Error Handling, Postman collection.
- **Le Duc Son:** Reviews, Feedback & Gemini AI proxy.
- **Nguyen Xuan Thinh:** Categories, Products & Orders CRUD.
- **Nguyen Dac Thinh:** Da Nang Branches API (GPS coordinates).
- **Le Tu Nhat Thach:** Multer upload, Seed data, EJS Admin Dashboard.

## Tech Stack

- **Runtime & Framework:** Node.js, Express.js
- **Database:** MongoDB Atlas (Mongoose)
- **Security:** JWT, Bcrypt, Helmet, CORS
- **Package Manager:** `pnpm`

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment variables (add your MongoDB Atlas URI)
cp .env.example .env

# 3. Start development server
pnpm run dev
```

Server runs at `http://localhost:5000`.

## Project Structure

```text
sdn302-freshbite-backend/
├── config/             # Database connection
├── controllers/        # Route controllers
├── middlewares/        # Auth, Validation, Error handlers
├── models/             # Mongoose schemas
├── routes/             # API routes
├── docs/               # Postman collection
├── server.js           # App entry point
└── package.json
```

## API Endpoints (Auth Module)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Health check |
| `POST` | `/api/auth/register` | Public | Register new user / admin |
| `POST` | `/api/auth/login` | Public | Login & receive 7-day JWT |
| `GET` | `/api/auth/me` | Bearer Token | Get current user profile |
| `PUT` | `/api/auth/profile` | Bearer Token | Update profile info |
| `PUT` | `/api/auth/change-password` | Bearer Token | Change password |

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

## Testing

Import `docs/FreshBite_DaNang_API.postman_collection.json` into Postman. Login requests automatically extract and set the `{{token}}` variable for protected routes.
Để chạy nạp dữ liệu 4 chi nhánh mẫu Đà Nẵng:
```bash
npm run seed:branches
```