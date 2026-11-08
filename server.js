require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const { requestLogger, errorLogger } = require('./middlewares/loggerMiddleware');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const branchRoutes = require('./routes/branchRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const reportRoutes = require('./routes/reportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminWebRoutes = require('./routes/adminWebRoutes');

const app = express();
const server = http.createServer(app);

// Khởi tạo Socket.IO hỗ trợ Live Chat real-time (Lê Đức Sơn)
initSocket(server);

// Cấu hình Helmet bảo mật
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(cors());
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Cấu hình EJS View Engine (Slot 7 - Web Admin & Barista KDS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static assets: public/ cho CSS/JS giao diện và uploads/ cho ảnh tĩnh
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'FreshBite API running' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Các API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes); // hỗ trợ routing /api/users/favorites theo đặc tả
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);

// Module Uploads & File Downloads (Slot 12 - Lê Tự Nhật Thạch)
app.use('/api/uploads', uploadRoutes);
app.use('/api/upload', uploadRoutes); // alias theo đặc tả

// Web Admin SSR (Slot 7: EJS Server-Side Rendering)
app.use('/admin', adminWebRoutes);

// Middleware bắt lỗi phải đặt ở cuối cùng sau tất cả routes
app.use(notFound);
app.use(errorLogger);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  if (server) server.close(() => process.exit(1));
  else process.exit(1);
});

module.exports = app;
