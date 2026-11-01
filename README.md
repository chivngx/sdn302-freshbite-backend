# FreshBite Backend (SDN302)

RESTful API backend for **FreshBite Coffee & Bakery (Da Nang)** – an Order Ahead & Pick-up system serving React Native and Flutter mobile clients.

## Team & Contribution (20% Each)

- **Lê Đức Sơn (Nhóm trưởng):** Operations & Live Chat Lead (Live Chat CSKH 2 chiều, Reviews đánh giá, Báo cáo ca quầy Barista).
- **Nguyễn Chí Vương:** API Architect / Auth & Security Lead (Thiết kế RESTful API, Module Auth JWT/Bcrypt, Module Favorites, Postman Test Suite).
- **Nguyễn Xuân Thịnh:** BE Core Lead / Product & Orders (Express Server, CRUD Categories/Products/Orders, Server-side Pricing, Deep Population).
- **Nguyễn Đắc Thịnh:** Branches & Vouchers & Error Handling (API 4 Chi nhánh Đà Nẵng GPS, Quản lý Tồn kho outOfStock, Module Vouchers, Error Middleware).
- **Lê Tự Nhật Thạch:** Uploads, Seed Data & Web Admin SSR (Multer upload tĩnh `/uploads`, 3 Script Seed Data, Giao diện EJS Web Admin KDS Barista).

## Tech Stack

- **Runtime & Framework:** Node.js, Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Security:** JWT (Stateless Bearer Token), Bcrypt (Salt 10), Helmet, CORS
- **Template Engine:** EJS (Web Admin KDS Barista)
- **Validation:** Express-Validator
- **Package Manager:** `pnpm`

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment variables (add your MongoDB Atlas URI)
cp .env.example .env

# 3. Seed initial database (users & test products)
pnpm run seed:users
pnpm run seed:test

# 4. Start development server
pnpm run dev
```

Server runs at `http://localhost:5000`.

## Project Structure

```text
sdn302-freshbite-backend/
├── config/             # Database connection (db.js)
├── controllers/        # Route controllers (auth, category, product, order, branch, voucher, chat, review, report)
├── middlewares/        # Auth (JWT), Validation, Error handlers
├── models/             # Mongoose schemas (User, Product, Order, Branch, Category, Voucher, Review, Message)
├── routes/             # API routes
├── seeds/              # Database seed scripts
├── docs/               # Postman collection test suite
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

## Testing

Import `docs/FreshBite_DaNang_API.postman_collection.json` vào Postman. Các request Login sẽ tự động trích xuất và lưu biến `{{token}}`, `{{adminToken}}` và `{{favoriteProductId}}` cho toàn bộ test suite.
