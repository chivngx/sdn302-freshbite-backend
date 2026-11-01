/**
 * Custom Error Class cho các lỗi nghiệp vụ trong hệ thống FreshBite
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware bắt lỗi 404 khi truy cập route không tồn tại
 */
const notFound = (req, res, next) => {
  const error = new AppError(`Không tìm thấy tài nguyên: ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Middleware bắt lỗi toàn cục (Global Error Handling Middleware)
 * Chuẩn hóa toàn bộ các lỗi: Mongoose, JWT, Multer, SyntaxError, AppError
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Lỗi máy chủ nội bộ!';

  // 1. Lỗi CastError trong MongoDB / Mongoose (ID sai định dạng ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Định dạng ID không hợp lệ cho trường: ${err.path || 'id'}`;
  }

  // 2. Lỗi trùng lặp unique key trong MongoDB (Mã lỗi 11000)
  else if (err.code === 11000) {
    statusCode = 400;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'Dữ liệu';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = `${field} '${value}' đã tồn tại trong hệ thống!`;
  }

  // 3. Lỗi Schema ValidationError trong Mongoose
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // 4. Lỗi JSON Token (JWT không hợp lệ)
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token xác thực không hợp lệ hoặc đã bị chỉnh sửa!';
  }

  // 5. Lỗi JWT hết hạn
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Phiên đăng nhập đã hết hạn! Vui lòng đăng nhập lại.';
  }

  // 6. Lỗi SyntaxError khi client gửi JSON sai cú pháp
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Dữ liệu JSON gửi lên không đúng định dạng cú pháp!';
  }

  // 7. Lỗi Multer (Upload file)
  else if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Dung lượng ảnh vượt quá kích thước cho phép (tối đa 5MB)!';
    } else {
      message = `Lỗi tải tệp lên: ${err.message}`;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && {
      errorType: err.name,
      stack: err.stack
    })
  });
};

module.exports = {
  AppError,
  notFound,
  errorHandler
};