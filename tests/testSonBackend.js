/**
 * Test Suite kiểm thử toàn diện phần nhiệm vụ của Lê Đức Sơn (Nhóm trưởng / Operations & Live Chat Lead) - SDN302
 * Bao gồm:
 * 1. Module Live Chat CSKH quầy chi nhánh 2 chiều (/api/chats)
 * 2. Module Đánh giá (Reviews) & Tính điểm sao trung bình ($avg) (/api/reviews)
 * 3. Module Báo cáo ca & Đối soát doanh thu quầy Barista cuối ngày (Shift Reconciliation) (/api/reports)
 */

process.env.NODE_ENV = 'test';
require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server');
const connectDB = require('../config/db');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Product = require('../models/Product');
const Message = require('../models/Message');
const Review = require('../models/Review');

let server;
let baseUrl;
let adminToken;
let userToken;
let customerUser;
let staffAdmin;
let sampleBranch;
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
  console.log(' BẮT ĐẦU KIỂM THỬ NHIỆM VỤ LÊ ĐỨC SƠN - MÔN SDN302');
  console.log(' (Live Chat CSKH 2 Chiều, Đánh Giá Reviews, Báo Cáo Ca Quầy)');
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

    staffAdmin = await User.findOne({ role: 'admin' });
    customerUser = await User.findOne({ role: 'user' });
    sampleBranch = await Branch.findOne({ isActive: true });
    sampleProduct = await Product.findOne({ isAvailable: true });

    if (!staffAdmin || !customerUser || !sampleBranch || !sampleProduct) {
      throw new Error('Chưa đủ dữ liệu test! Vui lòng chạy "npm run seed:test" trước.');
    }

    adminToken = jwt.sign({ id: staffAdmin._id, role: staffAdmin.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    userToken = jwt.sign({ id: customerUser._id, role: customerUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // -------------------------------------------------------------
    // NHÓM 1: LIVE CHAT CSKH QUẦY CHI NHÁNH 2 CHIỀU (/api/chats)
    // -------------------------------------------------------------
    console.log('--- 1. KIỂM THỬ LIVE CHAT CSKH QUẦY 2 CHIỀU (/api/chats) ---');

    // Test 1.1: Khách gửi tin nhắn tới quầy
    const resSendCustomer = await request({
      method: 'POST',
      path: `/api/chats/${sampleBranch._id}`,
      headers: { Authorization: `Bearer ${userToken}` },
      body: { content: 'Xin chào quầy, món Cà phê muối của mình còn làm không ạ?' }
    });
    assert(resSendCustomer.statusCode === 201, 'Khách gửi tin nhắn tới quầy thành công (201 Created)');
    assert(resSendCustomer.data.data.senderRole === 'customer', 'senderRole được xác định chuẩn xác là "customer"');
    assert(resSendCustomer.data.data.branchId.toString() === sampleBranch._id.toString(), 'Tin nhắn gắn đúng ID chi nhánh nhận');

    // Test 1.2: Nhân viên quầy trả lời tin nhắn của khách
    const resReplyStaff = await request({
      method: 'POST',
      path: `/api/chats/${sampleBranch._id}/reply`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        targetUserId: customerUser._id.toString(),
        content: 'Dạ chào bạn, quầy đang pha chế và sẽ giao cho bạn ngay sau 5 phút nữa ạ!'
      }
    });
    assert(resReplyStaff.statusCode === 201, 'Nhân viên quầy trả lời khách thành công (201 Created)');
    assert(resReplyStaff.data.data.senderRole === 'staff', 'senderRole phản hồi được gán là "staff"');

    // Test 1.3: Lấy lịch sử hội thoại 2 chiều của khách tại chi nhánh
    const resHistory = await request({
      method: 'GET',
      path: `/api/chats/${sampleBranch._id}`,
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(resHistory.statusCode === 200, 'Lấy lịch sử hội thoại 2 chiều trả về 200 OK');
    assert(Array.isArray(resHistory.data.data) && resHistory.data.data.length >= 2, 'Lịch sử hội thoại chứa đầy đủ các lượt tin nhắn 2 chiều');

    // Test 1.4: Lấy danh sách khách hàng đang chat tại chi nhánh cho nhân viên quầy
    const resActiveCustomers = await request({
      method: 'GET',
      path: `/api/chats/${sampleBranch._id}/customers`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resActiveCustomers.statusCode === 200, 'Lấy danh sách khách hàng đang chat tại chi nhánh thành công (200 OK)');
    assert(Array.isArray(resActiveCustomers.data.data), 'Danh sách trả về dạng mảng');

    // Test 1.5: Đánh dấu tin nhắn đã đọc
    const resMarkRead = await request({
      method: 'PATCH',
      path: `/api/chats/${sampleBranch._id}/read`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { customerId: customerUser._id.toString() }
    });
    assert(resMarkRead.statusCode === 200, 'Đánh dấu tin nhắn đã đọc thành công (200 OK)');

    // -------------------------------------------------------------
    // NHÓM 2: ĐÁNH GIÁ REVIEWS & TÍNH SAO TRUNG BÌNH (/api/reviews)
    // -------------------------------------------------------------
    console.log('\n--- 2. KIỂM THỬ ĐÁNH GIÁ (REVIEWS) & TÍNH SAO TRUNG BÌNH (/api/reviews) ---');

    // Test 2.1: Khách gửi đánh giá 5 sao cho món ăn
    const resCreateReview = await request({
      method: 'POST',
      path: '/api/reviews',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        productId: sampleProduct._id.toString(),
        branchId: sampleBranch._id.toString(),
        rating: 5,
        comment: 'Cà phê rất đậm đà, chuẩn vị đặc sản Đà Nẵng!'
      }
    });
    assert(resCreateReview.statusCode === 201, 'Khách gửi đánh giá món ăn thành công (201 Created)');
    assert(resCreateReview.data.data.rating === 5, 'Lưu số sao đánh giá chuẩn xác là 5');

    // Test 2.2: Lấy danh sách đánh giá và điểm sao trung bình bằng MongoDB Aggregation
    const resGetReviews = await request({
      method: 'GET',
      path: `/api/reviews/${sampleProduct._id}`
    });
    assert(resGetReviews.statusCode === 200, 'Lấy danh sách đánh giá món ăn trả về 200 OK');
    const avg = resGetReviews.data.avgRating !== undefined ? resGetReviews.data.avgRating : resGetReviews.data.data?.avgRating;
    const total = resGetReviews.data.totalReviews !== undefined ? resGetReviews.data.totalReviews : resGetReviews.data.data?.totalReviews;
    assert(typeof avg === 'number', 'Có tính toán điểm sao trung bình (avgRating)');
    assert(total >= 1, 'Có đếm tổng số lượt đánh giá (totalReviews >= 1)');

    // -------------------------------------------------------------
    // NHÓM 3: BÁO CÁO CA & ĐỐI SOÁT DOANH THU QUẦY (/api/reports)
    // -------------------------------------------------------------
    console.log('\n--- 3. KIỂM THỬ BÁO CÁO CA QUẦY (SHIFT RECONCILIATION) (/api/reports) ---');

    // Test 3.1: Quản trị viên truy vấn báo cáo ca quầy
    const resShiftReport = await request({
      method: 'GET',
      path: `/api/reports/shift?branchId=${sampleBranch._id}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resShiftReport.statusCode === 200, 'Truy vấn báo cáo ca quầy trả về 200 OK');
    assert(typeof resShiftReport.data.data.totalOrders === 'number', 'Thống kê tổng số đơn hàng');
    assert(typeof resShiftReport.data.data.totalRevenue === 'number', 'Thống kê tổng doanh thu thực thu');
    assert(typeof resShiftReport.data.data.cashRevenue === 'number', 'Tách riêng doanh thu tiền mặt tại quầy');
    assert(typeof resShiftReport.data.data.digitalRevenue === 'number', 'Tách riêng doanh thu thanh toán điện tử');

    // Test 3.2: Xuất file báo cáo ca dạng CSV qua res.download()
    const resExportCsv = await request({
      method: 'GET',
      path: `/api/reports/shift/export?branchId=${sampleBranch._id}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resExportCsv.statusCode === 200, 'Xuất file CSV báo cáo ca thành công (200 OK)');
    assert(
      resExportCsv.headers['content-disposition'] && resExportCsv.headers['content-disposition'].includes('attachment'),
      'Header Content-Disposition kích hoạt tải file CSV đối soát (res.download)'
    );

    console.log('\n=============================================================');
    console.log(` KẾT QUẢ KIỂM THỬ: ${passed} PASSED / ${failed} FAILED`);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('>>> TẤT CẢ CÁC MỤC KIỂM THỬ CỦA LÊ ĐỨC SƠN ĐỀU ĐẠT CHUẨN 100%! <<<\n');
      process.exit(0);
    }
  } catch (err) {
    console.error('Lỗi khi chạy bộ test Sơn:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
};

runTests();
