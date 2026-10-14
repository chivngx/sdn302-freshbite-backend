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

## Testing

Import `docs/FreshBite_DaNang_API.postman_collection.json` into Postman. Login requests automatically extract and set the `{{token}}` variable for protected routes.