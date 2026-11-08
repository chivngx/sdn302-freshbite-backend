require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/db');
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

// Cau hinh Helmet bao mat va ho tro EJS SSR giao dien
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
  })
);
app.use(cors());
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cau hinh EJS View Engine (Slot 7 - Web Admin & Barista KDS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static assets: public/ cho CSS/JS giao dien va uploads/ cho anh tinh
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'FreshBite API running' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cac API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes); // ho tro routing /api/users/favorites theo dac ta
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/upload', uploadRoutes); // alias theo dac ta

// Web Admin SSR (Slot 7: EJS Server-Side Rendering)
app.use('/admin', adminWebRoutes);

// middleware bat loi phai dat o cuoi cung sau tat ca routes
app.use(notFound);
app.use(errorLogger);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

if (require.main === module) {
  connectDB().then(() => {
    server = app.listen(PORT, () => {
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
