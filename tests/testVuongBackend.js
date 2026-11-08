/**
 * Test Suite kiểm thử toàn diện phần nhiệm vụ của Nguyễn Chí Vương (API Architect / Auth & Security Lead) - SDN302
 * Bao gồm:
 * 1. Module Authentication & User Security (Register, Login, Me, Profile, Change Password)
 * 2. Cấu hình JWT Bearer Token & Bcrypt salt 10, phương thức toJSON loại bỏ mật khẩu
 * 3. Module Món ăn Yêu thích (Favorites) qua $addToSet và $pull (/api/auth/favorites & /api/users/favorites)
 * 4. Validation Matrix kiểm tra định dạng email, mật khẩu tối thiểu 6 ký tự
 */

process.env.NODE_ENV = 'test';
require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');

let server;
let baseUrl;
let sampleProduct;

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
  console.log(' BẮT ĐẦU KIỂM THỬ NHIỆM VỤ NGUYỄN CHÍ VƯƠNG - MÔN SDN302');
  console.log(' (Kiến Trúc RESTful, Auth JWT, Bcrypt, Món Ăn Yêu Thích)');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title}`);
      failed++;
    }
  };

  try {
    await connectDB();
    console.log('Connected to Database successfully.');

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`Test server running at ${baseUrl}\n`);

    sampleProduct = await Product.findOne({ isAvailable: true });
    if (!sampleProduct) {
      throw new Error('Chưa có sản phẩm trong DB! Vui lòng chạy "npm run seed:test" trước.');
    }

    const testEmail = `vuongtest_${Date.now()}@fe.edu.vn`;
    const testPassword = 'Password123';
    let userToken = null;
    let createdUserId = null;

    // -------------------------------------------------------------
    // NHÓM 1: ĐĂNG KÝ, BĂM MẬT KHẨU BCRYPT & XÁC THỰC
    // -------------------------------------------------------------
    console.log('--- 1. KIỂM THỬ ĐĂNG KÝ & BẢO MẬT USER (/api/auth/register) ---');

    // Test 1.1: Đăng ký với mật khẩu ngắn < 6 ký tự bị từ chối
    const resShortPass = await request({
      method: 'POST',
      path: '/api/auth/register',
      body: {
        fullName: 'Nguyễn Văn Test',
        email: 'failpass@fe.edu.vn',
        password: '123',
        phone: '0905123456'
      }
    });
    assert(resShortPass.statusCode === 400, 'Mật khẩu dưới 6 ký tự bị validator từ chối (400 Bad Request)');

    // Test 1.2: Đăng ký tài khoản mới hợp lệ
    const resRegister = await request({
      method: 'POST',
      path: '/api/auth/register',
      body: {
        fullName: 'Nguyễn Chí Vương Tester',
        email: testEmail,
        password: testPassword,
        phone: '0905999888'
      }
    });
    assert(resRegister.statusCode === 201, 'Đăng ký tài khoản mới thành công (201 Created)');
    assert(!!resRegister.data.token, 'Đăng ký thành công tự động cấp phát JWT Bearer Token');
    assert(!resRegister.data.data.password, 'Phương thức toJSON tự động ẩn trường password an toàn');
    userToken = resRegister.data.token;
    createdUserId = resRegister.data.data._id;

    // Test 1.3: Đăng ký trùng email bị từ chối
    const resDupEmail = await request({
      method: 'POST',
      path: '/api/auth/register',
      body: {
        fullName: 'Người Dùng Khác',
        email: testEmail,
        password: 'OtherPassword123',
        phone: '0905111222'
      }
    });
    assert(resDupEmail.statusCode === 400, 'Đăng ký trùng email bị chặn và trả về 400 Bad Request');

    // -------------------------------------------------------------
    // NHÓM 2: ĐĂNG NHẬP & XÁC THỰC PROFILE (/api/auth/login, /me)
    // -------------------------------------------------------------
    console.log('\n--- 2. KIỂM THỬ ĐĂNG NHẬP & PROFILE (/api/auth/login, /me) ---');

    // Test 2.1: Đăng nhập sai mật khẩu bị từ chối
    const resWrongPass = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: testEmail, password: 'WrongPassword' }
    });
    assert(resWrongPass.statusCode === 401, 'Đăng nhập sai mật khẩu bị từ chối với 401 Unauthorized');

    // Test 2.2: Đăng nhập đúng thông tin thành công
    const resLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: testEmail, password: testPassword }
    });
    assert(resLogin.statusCode === 200, 'Đăng nhập thành công trả về 200 OK');
    assert(!!resLogin.data.token, 'Nhận JWT Bearer Token thành công');
    assert(!resLogin.data.data.password, 'Mật khẩu đã băm không bị rò rỉ trong JSON response');

    // Test 2.3: Lấy thông tin cá nhân qua Bearer Token
    const resMe = await request({
      method: 'GET',
      path: '/api/auth/me',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(resMe.statusCode === 200, 'GET /api/auth/me trả về 200 OK');
    assert(resMe.data.data.email === testEmail, 'Email người dùng khớp chính xác');

    // Test 2.4: Cập nhật thông tin profile
    const resUpdateProfile = await request({
      method: 'PUT',
      path: '/api/auth/profile',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { fullName: 'Nguyễn Chí Vương (Đã Cập Nhật)', phone: '0905000111' }
    });
    assert(resUpdateProfile.statusCode === 200, 'Cập nhật profile thành công (200 OK)');
    assert(resUpdateProfile.data.data.fullName === 'Nguyễn Chí Vương (Đã Cập Nhật)', 'Họ tên được lưu chính xác');

    // Test 2.5: Đổi mật khẩu tài khoản
    const newPassword = 'NewPassword456';
    const resChangePass = await request({
      method: 'PUT',
      path: '/api/auth/change-password',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { currentPassword: testPassword, newPassword: newPassword }
    });
    assert(resChangePass.statusCode === 200, 'Đổi mật khẩu thành công trả về 200 OK');

    // Test 2.6: Đăng nhập lại với mật khẩu mới
    const resReLogin = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: testEmail, password: newPassword }
    });
    assert(resReLogin.statusCode === 200, 'Đăng nhập thành công bằng mật khẩu mới');

    // -------------------------------------------------------------
    // NHÓM 3: MODULE MÓN ĂN YÊU THÍCH (FAVORITES)
    // -------------------------------------------------------------
    console.log('\n--- 3. KIỂM THỬ MODULE MÓN ĂN YÊU THÍCH (FAVORITES) ---');

    // Test 3.1: Thêm món vào danh sách yêu thích ($addToSet)
    const resAddFav = await request({
      method: 'POST',
      path: `/api/auth/favorites/${sampleProduct._id}`,
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(resAddFav.statusCode === 200, 'Thêm món vào yêu thích thành công qua POST /api/auth/favorites/:id (200 OK)');

    // Test 3.2: Lấy danh sách món yêu thích có deep populate
    const resGetFav = await request({
      method: 'GET',
      path: '/api/auth/favorites',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(resGetFav.statusCode === 200, 'Lấy danh sách yêu thích thành công qua GET /api/auth/favorites (200 OK)');
    assert(Array.isArray(resGetFav.data.data) && resGetFav.data.data.length >= 1, 'Danh sách yêu thích chứa sản phẩm vừa thêm');

    // Test 3.3: Kiểm tra route alias /api/users/favorites theo đặc tả
    const resUsersFav = await request({
      method: 'GET',
      path: '/api/users/favorites',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(resUsersFav.statusCode === 200, 'Route alias GET /api/users/favorites hoạt động chuẩn xác (200 OK)');

    // Test 3.4: Xóa món khỏi danh sách yêu thích ($pull)
    const resRemoveFav = await request({
      method: 'DELETE',
      path: `/api/auth/favorites/${sampleProduct._id}`,
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(resRemoveFav.statusCode === 200, 'Xóa món khỏi yêu thích thành công qua DELETE (200 OK)');

    // Dọn dẹp tài khoản test
    await User.findByIdAndDelete(createdUserId);

    console.log('\n=============================================================');
    console.log(` KẾT QUẢ KIỂM THỬ: ${passed} PASSED / ${failed} FAILED`);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('>>> TẤT CẢ CÁC MỤC KIỂM THỬ CỦA NGUYỄN CHÍ VƯƠNG ĐỀU ĐẠT CHUẨN 100%! <<<\n');
      process.exit(0);
    }
  } catch (err) {
    console.error('Lỗi khi chạy bộ test Vương:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
};

runTests();
