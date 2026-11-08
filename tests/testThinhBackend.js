/**
 * Test Suite kiểm thử toàn diện phần nhiệm vụ của Nguyễn Đắc Thịnh môn SDN302
 * Bao gồm:
 * 1. API Chi nhánh (/api/branches) - 4 Chi nhánh Đà Nẵng
 * 2. Lọc theo quận, tìm kiếm, tính khoảng cách GPS người dùng theo công thức Haversine
 * 3. Middleware bắt lỗi toàn cục (errorMiddleware.js) - 400, 401, 403, 404, 500
 * 4. Logger middleware & logger utility
 */

process.env.NODE_ENV = 'test';
require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server');
const connectDB = require('../config/db');
const Branch = require('../models/Branch');
const User = require('../models/User');
const { logger } = require('../middlewares/loggerMiddleware');

let server;
let baseUrl;
let adminToken;
let userToken;
let sampleBranchId;

// Helper thực hiện HTTP Request
const request = ({ method, path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n=============================================================');
  console.log(' BẮT ĐẦU KIỂM THỬ NHIỆM VỤ NGUYỄN ĐẮC THỊNH - MÔN SDN302');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${title}`);
      failed++;
    }
  };

  try {
    await connectDB();
    console.log('Connected to Database successfully.');

    // Tạo server test trên port ngẫu nhiên
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`Test server running at ${baseUrl}\n`);

    // Chuẩn bị Tokens
    const adminUser = await User.findOne({ role: 'admin' });
    const normalUser = await User.findOne({ role: 'user' });

    if (!adminUser || !normalUser) {
      throw new Error('Chưa có user/admin trong DB! Vui lòng chạy "node seeds/seedData.js" trước.');
    }

    adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    userToken = jwt.sign({ id: normalUser._id, role: normalUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // -------------------------------------------------------------
    // NHÓM 1: KIỂM THỬ API CHI NHÁNH ĐÀ NẴNG (GET /api/branches)
    // -------------------------------------------------------------
    console.log('--- 1. KIỂM THỬ API CHI NHÁNH ĐÀ NẴNG (/api/branches) ---');

    // Test 1.1: Lấy tất cả 4 chi nhánh
    const resAll = await request({ method: 'GET', path: '/api/branches' });
    assert(resAll.statusCode === 200, 'GET /api/branches trả về mã HTTP 200 OK');
    assert(resAll.data.success === true, 'Response body có success: true');
    assert(Array.isArray(resAll.data.data) && resAll.data.data.length >= 4, `Trả về đủ danh sách các chi nhánh Đà Nẵng (có ${resAll.data.data.length} chi nhánh)`);

    // Lưu lại 1 ID chi nhánh để dùng cho các test sau
    sampleBranchId = resAll.data.data[0]._id;

    // Test 1.2: Kiểm tra chi nhánh FPT City Đà Nẵng
    const fptBranch = resAll.data.data.find(b => b.name.includes('FPT City'));
    assert(!!fptBranch, 'Có chi nhánh chiến lược "FreshBite FPT City (Ngũ Hành Sơn)"');
    assert(fptBranch && fptBranch.district === 'Ngũ Hành Sơn', 'Chi nhánh FPT City thuộc quận "Ngũ Hành Sơn"');
    assert(fptBranch && typeof fptBranch.latitude === 'number' && typeof fptBranch.longitude === 'number', 'Chi nhánh có đầy đủ tọa độ GPS (latitude & longitude)');

    // Test 1.3: Lọc chi nhánh theo quận (district=Hải Châu)
    const resHaiChau = await request({ method: 'GET', path: '/api/branches?district=Hải Châu' });
    assert(resHaiChau.statusCode === 200, 'GET /api/branches?district=Hải Châu trả về 200 OK');
    assert(resHaiChau.data.data.every(b => b.district === 'Hải Châu'), 'Tất cả chi nhánh trả về đều thuộc quận Hải Châu');

    // Test 1.4: Tìm kiếm theo từ khóa (search=Điện Biên Phủ)
    const resSearch = await request({ method: 'GET', path: '/api/branches?search=Điện%20Biên%20Phủ' });
    assert(resSearch.statusCode === 200, 'GET /api/branches?search=Điện Biên Phủ trả về 200 OK');
    assert(resSearch.data.data.some(b => b.name.includes('Điện Biên Phủ') || b.address.includes('Điện Biên Phủ')), 'Tìm thấy chi nhánh theo từ khóa tìm kiếm');

    // Test 1.5: Tính khoảng cách GPS người dùng theo công thức Haversine (tọa độ FPT City)
    const resGps = await request({ method: 'GET', path: '/api/branches?userLat=15.969234&userLng=108.261221' });
    assert(resGps.statusCode === 200, 'GET /api/branches kèm GPS userLat & userLng trả về 200 OK');
    assert(resGps.data.data[0].name.includes('FPT City'), 'Chi nhánh gần nhất được đưa lên đầu danh sách (FPT City)');
    assert(typeof resGps.data.data[0].distanceKm === 'number' && resGps.data.data[0].distanceKm < 0.1, `Khoảng cách tính chính xác ~0 km (${resGps.data.data[0].distanceKm} km)`);

    // Test 1.6: Xem chi tiết 1 chi nhánh hợp lệ
    const resDetail = await request({ method: 'GET', path: `/api/branches/${sampleBranchId}` });
    assert(resDetail.statusCode === 200, 'GET /api/branches/:id trả về 200 OK cho ID hợp lệ');
    assert(resDetail.data.data._id === sampleBranchId, 'Dữ liệu trả về đúng ID đã yêu cầu');

    // -------------------------------------------------------------
    // NHÓM 2: KIỂM THỬ BẢO MẬT & PHÂN QUYỀN ADMIN CHO CHI NHÁNH
    // -------------------------------------------------------------
    console.log('\n--- 2. KIỂM THỬ BẢO MẬT & PHÂN QUYỀN (401 & 403) ---');

    // Test 2.1: Tạo chi nhánh không có token -> 401 Unauthorized
    const resCreateNoAuth = await request({
      method: 'POST',
      path: '/api/branches',
      body: { name: 'Chi nhánh trái phép' }
    });
    assert(resCreateNoAuth.statusCode === 401, 'POST /api/branches không có token bị từ chối với mã 401 Unauthorized');

    // Test 2.2: Tạo chi nhánh bằng token thường (role: user) -> 403 Forbidden
    const resCreateUserRole = await request({
      method: 'POST',
      path: '/api/branches',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { name: 'Chi nhánh giả mạo' }
    });
    assert(resCreateUserRole.statusCode === 403, 'POST /api/branches với token thường (user) bị từ chối với mã 403 Forbidden');

    // Test 2.3: Tạo chi nhánh bằng Admin Token với dữ liệu hợp lệ -> 201 Created
    const newBranchPayload = {
      name: 'FreshBite Test Cầu Rồng (Hải Châu)',
      address: '01 Đường 2/9, P. Bình Hiên, Q. Hải Châu, Đà Nẵng',
      district: 'Hải Châu',
      latitude: 16.060123,
      longitude: 108.222345,
      phone: '0236.388.9999',
      openingHours: '06:30 - 23:00',
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
      isActive: true
    };
    const resCreateAdmin = await request({
      method: 'POST',
      path: '/api/branches',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: newBranchPayload
    });
    assert(resCreateAdmin.statusCode === 201, 'POST /api/branches với Admin Token tạo thành công trả về mã 201 Created');
    const createdBranchId = resCreateAdmin.data.data ? resCreateAdmin.data.data._id : null;

    // Test 2.4: Kiểm tra chống trùng tên chi nhánh
    const resDuplicate = await request({
      method: 'POST',
      path: '/api/branches',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: newBranchPayload
    });
    assert(resDuplicate.statusCode === 400, 'POST /api/branches báo lỗi 400 khi tên chi nhánh đã tồn tại');

    // Test 2.5: Cập nhật thông tin chi nhánh [Admin] -> 200 OK
    if (createdBranchId) {
      const resUpdate = await request({
        method: 'PUT',
        path: `/api/branches/${createdBranchId}`,
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { openingHours: '06:00 - 23:30' }
      });
      assert(resUpdate.statusCode === 200, 'PUT /api/branches/:id cập nhật giờ mở cửa thành công trả về 200 OK');
      assert(resUpdate.data.data.openingHours === '06:00 - 23:30', 'Dữ liệu đã được cập nhật chính xác');

      // Test 2.6: Xóa chi nhánh vừa tạo [Admin] -> 200 OK
      const resDelete = await request({
        method: 'DELETE',
        path: `/api/branches/${createdBranchId}`,
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resDelete.statusCode === 200, 'DELETE /api/branches/:id xóa chi nhánh thành công trả về 200 OK');
    }

    // -------------------------------------------------------------
    // NHÓM 3: KIỂM THỬ MIDDLEWARE BẮT LỖI TOÀN CỤC (errorMiddleware.js)
    // -------------------------------------------------------------
    console.log('\n--- 3. KIỂM THỬ MIDDLEWARE BẮT LỖI TOÀN CỤC (errorMiddleware.js) ---');

    // Test 3.1: Lỗi 400 Bad Request khi ID không đúng định dạng ObjectId (CastError / Validator)
    const resBadId = await request({ method: 'GET', path: '/api/branches/id-sai-dinh-dang-123' });
    assert(resBadId.statusCode === 400, 'Truy cập ID sai định dạng trả về mã HTTP 400 Bad Request');
    assert(resBadId.data.success === false, 'Phản hồi có success: false');

    // Test 3.2: Lỗi 404 Not Found khi ID hợp lệ nhưng không tồn tại trong DB
    const resNotFoundId = await request({ method: 'GET', path: '/api/branches/507f1f77bcf86cd799439011' });
    assert(resNotFoundId.statusCode === 404, 'Truy cập ID không tồn tại trả về mã HTTP 404 Not Found');

    // Test 3.3: Lỗi 404 Not Found bắt bởi middleware notFound khi truy cập route không tồn tại
    const resNotFoundRoute = await request({ method: 'GET', path: '/api/duong-dan-khong-ton-tai' });
    assert(resNotFoundRoute.statusCode === 404, 'Route không tồn tại được middleware notFound chặn và trả về 404 Not Found');
    assert(typeof resNotFoundRoute.data.message === 'string' && resNotFoundRoute.data.message.includes('Không tìm thấy tài nguyên'), 'Message 404 chuẩn tiếng Việt thân thiện');

    // Test 3.4: Lỗi 400 Bad Request khi client gửi JSON sai cú pháp (SyntaxError)
    const resBadJson = await request({
      method: 'POST',
      path: '/api/branches',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: '{ "invalidJson": broken, '
    });
    assert(resBadJson.statusCode === 400, 'Client gửi JSON sai cú pháp được errorHandler bắt và trả về 400 Bad Request');

    // Test 3.5: Lỗi 400 Bad Request khi thiếu trường bắt buộc khi tạo chi nhánh (Validation)
    const resValidationFail = await request({
      method: 'POST',
      path: '/api/branches',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { name: 'A' } // tên quá ngắn, thiếu mọi trường bắt buộc
    });
    assert(resValidationFail.statusCode === 400, 'Thiếu trường bắt buộc bị validator chặn và trả về 400 Bad Request');

    // Test 3.6: Lỗi 500 Internal Server Error được bắt bởi errorHandler
    const mockReq = { method: 'GET', originalUrl: '/api/internal-test' };
    let mockStatusCode = 200;
    let mockJsonData = null;
    const mockRes = {
      statusCode: 200,
      status: function (code) {
        mockStatusCode = code;
        return this;
      },
      json: function (data) {
        mockJsonData = data;
        return this;
      }
    };
    const { errorHandler } = require('../middlewares/errorMiddleware');
    errorHandler(new Error('Lỗi máy chủ nội bộ giả lập'), mockReq, mockRes, () => {});
    assert(mockStatusCode === 500, 'Lỗi ngoại lệ hệ thống được errorHandler bắt toàn cục và trả về 500 Internal Server Error');
    assert(mockJsonData && mockJsonData.success === false, 'Phản hồi lỗi 500 có success: false');

    // -------------------------------------------------------------
    // NHÓM 4: KIỂM THỬ TIỆN ÍCH LOGGER (loggerMiddleware.js)
    // -------------------------------------------------------------
    console.log('\n--- 4. KIỂM THỬ LOGGER (loggerMiddleware.js) ---');
    assert(typeof logger.info === 'function', 'logger.info là hàm hợp lệ');
    assert(typeof logger.warn === 'function', 'logger.warn là hàm hợp lệ');
    assert(typeof logger.error === 'function', 'logger.error là hàm hợp lệ');
    assert(typeof logger.debug === 'function', 'logger.debug là hàm hợp lệ');

    logger.info('Kiểm thử ghi log info thành công');
    logger.warn('Kiểm thử ghi log warning thành công');
    logger.error('Kiểm thử ghi log error thành công');
    logger.debug('Kiểm thử ghi log debug thành công');

    console.log('\n=============================================================');
    console.log(` KẾT QUẢ KIỂM THỬ: ${passed} PASSED / ${failed} FAILED`);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('>>> TẤT CẢ CÁC MỤC KIỂM THỬ CỦA NGUYỄN ĐẮC THỊNH ĐỀU ĐẠT CHUẨN 100%! <<<\n');
      process.exit(0);
    }
  } catch (err) {
    console.error('Lỗi khi chạy bộ test:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }
};

runTests();

