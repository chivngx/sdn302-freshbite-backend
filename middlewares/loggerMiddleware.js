const morgan = require('morgan');

// Màu sắc ANSI cho console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

// Hàm lấy timestamp dạng [YYYY-MM-DD HH:mm:ss]
const getTimestamp = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8);
  return `${date} ${time}`;
};

// Định nghĩa format màu sắc dựa theo HTTP status code
morgan.token('colored-status', (req, res) => {
  const status = res.statusCode;
  let color = colors.green; // 2xx
  if (status >= 500) color = colors.red; // 5xx
  else if (status >= 400) color = colors.yellow; // 4xx
  else if (status >= 300) color = colors.cyan; // 3xx

  return `${color}${status}${colors.reset}`;
});

morgan.token('colored-method', (req) => {
  const method = req.method;
  let color = colors.cyan;
  if (method === 'GET') color = colors.green;
  else if (method === 'POST') color = colors.yellow;
  else if (method === 'PUT' || method === 'PATCH') color = colors.blue;
  else if (method === 'DELETE') color = colors.red;

  return `${colors.bright}${color}${method.padEnd(6)}${colors.reset}`;
});

morgan.token('timestamp', () => {
  return `${colors.gray}[${getTimestamp()}]${colors.reset}`;
});

// Format logging chuẩn cho HTTP request
const morganFormat = ':timestamp :colored-method :url :colored-status :response-time ms - :res[content-length]';

// Middleware ghi log request HTTP
const requestLogger = morgan(morganFormat, {
  skip: (req) => req.url === '/api/health' || req.url === '/favicon.ico'
});

// Helper xác định mã HTTP status phù hợp cho error
const getErrorStatusCode = (err, res) => {
  if (err.statusCode) return err.statusCode;
  if (err.status) return err.status;
  if (
    err.name === 'CastError' ||
    err.name === 'ValidationError' ||
    err.code === 11000 ||
    err.name === 'MulterError' ||
    (err instanceof SyntaxError && err.status === 400)
  ) {
    return 400;
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return 401;
  }
  return res.statusCode !== 200 ? res.statusCode : 500;
};

// Middleware ghi log lỗi khi có exception xảy ra
const errorLogger = (err, req, res, next) => {
  const status = getErrorStatusCode(err, res);
  const logMessage = `[${getTimestamp()}] [ERROR] ${req.method} ${req.originalUrl} - Status: ${status} - ${err.message}`;

  if (status >= 500) {
    console.error(`${colors.red}${logMessage}${colors.reset}`);
    if (err.stack) {
      console.error(`${colors.gray}${err.stack}${colors.reset}`);
    }
  } else {
    console.warn(`${colors.yellow}${logMessage}${colors.reset}`);
  }

  next(err);
};

// Tiện ích logger độc lập để dùng trong code controllers / services
const logger = {
  info: (msg, meta = '') => {
    console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.green}[INFO]${colors.reset} ${msg}`, meta);
  },
  warn: (msg, meta = '') => {
    console.warn(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.yellow}[WARN]${colors.reset} ${msg}`, meta);
  },
  error: (msg, meta = '') => {
    console.error(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.red}[ERROR]${colors.reset} ${msg}`, meta);
  },
  debug: (msg, meta = '') => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.cyan}[DEBUG]${colors.reset} ${msg}`, meta);
    }
  }
};

module.exports = {
  requestLogger,
  errorLogger,
  logger
};
