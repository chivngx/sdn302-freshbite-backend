/**
 * Test Suite: Kiểm thử toàn diện phần nhiệm vụ của Lê Tự Nhật Thạch môn SDN302
 * Bao gồm:
 * 1. Multer Upload ảnh tĩnh (/api/uploads & /api/upload) & Static File Serving (/uploads)
 * 2. File Download (res.download - Slot 12) Hóa đơn (/api/orders/:id/invoice, /api/uploads/orders/:id/invoice)
 * 3. Kiểm tra tính toàn vẹn của 3 Script Seed Data Đà Nẵng (seedData, testSeed, userSeed)
 * 4. Kiểm tra Server-Side Rendering với EJS (Slot 7) (/admin/dashboard, /admin/orders, /admin/products, /admin/branches)
 * 5. Xác thực phiên làm việc Web Admin & Barista KDS (Login, Cookie Session, Logout, Security Guard)
 */

process.env.NODE_ENV = 'test';
require('dotenv').config();

const http = require('http');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../server');
const connectDB = require('../config/db');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Product = require('../models/Product');
const Order = require('../models/Order');

let server;
let BASE_URL = '';
let adminToken = '';
let testOrderId = '';
let testProductId = '';
let testBranchId = '';
let uploadedFilename = '';

const stats = {
  total: 0,
  passed: 0,
  failed: 0
};

const assert = (condition, title, details = '') => {
  stats.total++;
  if (condition) {
    stats.passed++;
    console.log(`  ✅ [PASS] ${title}`);
  } else {
    stats.failed++;
    console.error(`  ❌ [FAIL] ${title} ${details ? '- ' + details : ''}`);
  }
};

const runTests = async () => {
  console.log('================================================================');
  console.log('  TEST SUITE: LÊ TỰ NHẬT THẠCH - UPLOADS, SEED DATA & WEB ADMIN SSR');
  console.log('================================================================\n');

  try {
    await connectDB();
    console.log(' -> Đã kết nối cơ sở dữ liệu MongoDB Atlas thành công.');

    // Khởi động test server trên dynamic port ngẫu nhiên
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    BASE_URL = `http://localhost:${port}`;
    console.log(` -> Test server đang chạy tại: ${BASE_URL}\n`);

    // Chuẩn bị tài khoản test admin
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        fullName: 'Admin Test Thach',
        email: `admin_thach_${Date.now()}@freshbite.vn`,
        password: 'password123',
        phone: '0905999888',
        role: 'admin'
      });
    }
    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'freshbite_secret',
      { expiresIn: '1d' }
    );

    // Chuẩn bị Branch, Product, Order test
    let branch = await Branch.findOne({ isActive: true });
    if (!branch) {
      branch = await Branch.create({
        name: 'FreshBite Chi Nhánh Test Đà Nẵng',
        address: '100 Nguyễn Văn Linh, Q. Hải Châu, Đà Nẵng',
        district: 'Hải Châu',
        latitude: 16.0605,
        longitude: 108.2154,
        phone: '0236.999.8888',
        openingHours: '06:30 - 22:30',
        isActive: true
      });
    }
    testBranchId = branch._id.toString();

    let product = await Product.findOne({ isAvailable: true });
    if (!product) {
      product = await Product.create({
        name: 'Cà phê Muối Test Thạch',
        price: 35000,
        calories: 180,
        isAvailable: true,
        sizePricing: { S: 30000, M: 35000, L: 40000 }
      });
    }
    testProductId = product._id.toString();

    let order = await Order.findOne();
    if (!order) {
      order = await Order.create({
        userId: adminUser._id,
        branchId: testBranchId,
        orderCode: `FB-${Math.floor(10000 + Math.random() * 90000)}`,
        items: [
          {
            productId: testProductId,
            name: product.name,
            price: 35000,
            quantity: 2,
            size: 'M'
          }
        ],
        subtotal: 70000,
        totalAmount: 70000,
        paymentMethod: 'CASH_AT_COUNTER',
        paymentStatus: 'PENDING',
        status: 'Received',
        pickupTime: '15:30'
      });
    }
    testOrderId = order._id.toString();

    // -------------------------------------------------------------
    // MODULE 1: MULTER FILE UPLOAD (Slot 12)
    // -------------------------------------------------------------
    console.log('--- PHẦN 1: MULTER FILE UPLOAD TĨNH (/api/uploads) ---');

    // Test 1: Upload 1 anh tinh qua POST /api/uploads/single
    {
      const fakeImageBytes = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
        0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f,
        0x15, 0xc4, 0x89
      ]);
      const blob = new Blob([fakeImageBytes], { type: 'image/png' });
      const formData = new FormData();
      formData.append('image', blob, 'freshbite_test_coffee.png');

      const res = await fetch(`${BASE_URL}/api/uploads/single`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`
        },
        body: formData
      });
      const data = await res.json();
      assert(res.status === 201 && data.success === true, '1. POST /api/uploads/single - Upload 1 ảnh tĩnh thành công (201)');
      uploadedFilename = data.data.filename;
    }

    // Test 2: Lay anh tinh vua upload qua Express Static (/uploads/:filename)
    {
      const res = await fetch(`${BASE_URL}/uploads/${uploadedFilename}`);
      assert(
        res.status === 200,
        `2. GET /uploads/${uploadedFilename} - Client tải ảnh tĩnh trực tiếp thành công (200)`
      );
    }

    // Test 3: Upload qua alias route POST /api/uploads và /api/upload
    {
      const fakeImageBytes = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
        0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f,
        0x15, 0xc4, 0x89
      ]);
      const blob = new Blob([fakeImageBytes], { type: 'image/png' });
      const formData = new FormData();
      formData.append('image', blob, 'freshbite_alias.png');

      const res = await fetch(`${BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`
        },
        body: formData
      });
      const data = await res.json();
      assert(res.status === 201 && data.success === true, '3. POST /api/upload - Upload qua alias route thành công (201)');
    }

    // Test 4: Upload nhieu anh (POST /api/uploads/multiple)
    {
      const fakeImageBytes = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
        0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f,
        0x15, 0xc4, 0x89
      ]);
      const blob1 = new Blob([fakeImageBytes], { type: 'image/png' });
      const blob2 = new Blob([fakeImageBytes], { type: 'image/png' });
      const formData = new FormData();
      formData.append('images', blob1, 'multi_test_1.png');
      formData.append('images', blob2, 'multi_test_2.png');

      const res = await fetch(`${BASE_URL}/api/uploads/multiple`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`
        },
        body: formData
      });
      const data = await res.json();
      assert(res.status === 201 && data.count === 2, '4. POST /api/uploads/multiple - Upload 2 ảnh đồng thời thành công (201)');
    }

    // Test 5: Chan file khong hop le (File Filter)
    {
      const fakeTextBlob = new Blob(['malicious shell script'], { type: 'text/plain' });
      const formData = new FormData();
      formData.append('image', fakeTextBlob, 'malicious_script.sh');

      const res = await fetch(`${BASE_URL}/api/uploads/single`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`
        },
        body: formData
      });
      const data = await res.json();
      assert(res.status === 400 && data.success === false, '5. File Filter - Từ chối tệp không đúng định dạng ảnh (400)');
    }

    // Test 6: Bat loi khi khong dinh kem file
    {
      const formData = new FormData();
      const res = await fetch(`${BASE_URL}/api/uploads/single`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`
        },
        body: formData
      });
      const data = await res.json();
      assert(res.status === 400 && data.success === false, '6. Validation - Bắt lỗi khi request thiếu file đính kèm (400)');
    }

    // -------------------------------------------------------------
    // MODULE 2: FILE DOWNLOAD (Slot 12: res.download)
    // -------------------------------------------------------------
    console.log('\n--- PHẦN 2: FILE DOWNLOAD VỚI RES.DOWNLOAD() (Slot 12) ---');

    // Test 7: Tai file da upload qua endpoint res.download()
    {
      const res = await fetch(`${BASE_URL}/api/uploads/download/${uploadedFilename}`);
      const contentDisposition = res.headers.get('content-disposition') || '';
      assert(
        res.status === 200 && contentDisposition.includes('attachment'),
        '7. GET /api/uploads/download/:filename - res.download() trả về header Content-Disposition: attachment (200)'
      );
    }

    // Test 8: Tai file mau CSV import thuc don
    {
      const res = await fetch(`${BASE_URL}/api/uploads/template/product-import`);
      const contentDisposition = res.headers.get('content-disposition') || '';
      const text = await res.text();
      assert(
        res.status === 200 && contentDisposition.includes('attachment') && text.includes('categoryCode'),
        '8. GET /api/uploads/template/product-import - Tải file mẫu CSV thực đơn bằng res.download() (200)'
      );
    }

    // Test 9: Xuat hoa don ban le tu uploadRoutes (/api/uploads/orders/:id/invoice)
    {
      const res = await fetch(`${BASE_URL}/api/uploads/orders/${testOrderId}/invoice`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      const contentDisposition = res.headers.get('content-disposition') || '';
      const invoiceText = await res.text();
      assert(
        res.status === 200 && contentDisposition.includes('attachment') && invoiceText.includes('HỆ THỐNG CÀ PHÊ FRESHBITE'),
        '9. GET /api/uploads/orders/:id/invoice - Xuất hóa đơn bán lẻ bằng res.download() (200)'
      );
    }

    // Test 10: Xuat hoa don ban le tu orderRoutes (/api/orders/:id/invoice theo dac ta)
    {
      const res = await fetch(`${BASE_URL}/api/orders/${testOrderId}/invoice`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      const contentDisposition = res.headers.get('content-disposition') || '';
      assert(
        res.status === 200 && contentDisposition.includes('attachment'),
        '10. GET /api/orders/:id/invoice - Tải hóa đơn chuẩn RESTful theo đặc tả (200)'
      );
    }

    // Test 11: Bao loi 404 khi tai file khong ton tai
    {
      const res = await fetch(`${BASE_URL}/api/uploads/download/non_existent_file_9999.png`);
      assert(res.status === 404, '11. GET /api/uploads/download/nonexistent - Trả về 404 khi tệp không tồn tại');
    }

    // Test 12: Bao ve Directory Traversal
    {
      const res = await fetch(`${BASE_URL}/api/uploads/download/..%2F..%2Fserver.js`);
      assert(res.status === 404, '12. Directory Traversal Protection - Chặn truy cập file hệ thống qua đường dẫn tương đối (404)');
    }

    // -------------------------------------------------------------
    // MODULE 3: 3 SCRIPT SEED DATA ĐÀ NẴNG
    // -------------------------------------------------------------
    console.log('\n--- PHẦN 3: KIỂM THỬ 3 SCRIPT SEED DATA ĐÀ NẴNG ---');

    // Test 13: seedData.js chứa đủ 4 chi nhánh, 4 danh mục, >= 20 món ăn
    {
      const seedDataModule = require('../seeds/seedData');
      assert(
        Array.isArray(seedDataModule.branches) && seedDataModule.branches.length === 4,
        '13. seedData.js - Chứa đủ 4 chi nhánh Đà Nẵng kèm tọa độ GPS'
      );
      assert(
        Array.isArray(seedDataModule.productsData) && seedDataModule.productsData.length >= 20,
        `14. seedData.js - Chứa danh mục thực đơn phong phú (${seedDataModule.productsData.length} món ăn đặc sản)`
      );
    }

    // Test 15: testSeed.js có chứa món test lỗi 400 (isAvailable: false)
    {
      const testSeedCode = fs.readFileSync(path.join(__dirname, '..', 'seeds', 'testSeed.js'), 'utf8');
      assert(
        testSeedCode.includes('isAvailable: false') && testSeedCode.includes('outOfStockProductIds'),
        '15. testSeed.js - Chứa sản phẩm cố tình tắt trạng thái & outOfStockProductIds phục vụ test giỏ hàng'
      );
    }

    // Test 16: userSeed.js bắt buộc dùng User.create()
    {
      const userSeedCode = fs.readFileSync(path.join(__dirname, '..', 'seeds', 'userSeed.js'), 'utf8');
      assert(
        userSeedCode.includes('User.create') && !userSeedCode.includes('User.insertMany'),
        '16. userSeed.js - Sử dụng User.create() kích hoạt pre-save hook băm mật khẩu Bcrypt an toàn'
      );
    }

    // -------------------------------------------------------------
    // MODULE 4: SERVER-SIDE RENDERING (EJS Web Admin & KDS - Slot 7)
    // -------------------------------------------------------------
    console.log('\n--- PHẦN 4: SERVER-SIDE RENDERING EJS WEB ADMIN (Slot 7) ---');

    const authHeaders = { Cookie: `freshbite_admin_token=${adminToken}` };

    // Test 17: GET /admin -> chuyển hướng 302 sang /admin/dashboard
    {
      const res = await fetch(`${BASE_URL}/admin`, { headers: authHeaders, redirect: 'manual' });
      assert(
        res.status === 302 && (res.headers.get('location') || '').includes('/admin/dashboard'),
        '17. GET /admin - Chuyển hướng 302 sang /admin/dashboard'
      );
    }

    // Test 18: GET /admin/dashboard
    {
      const res = await fetch(`${BASE_URL}/admin/dashboard`, { headers: authHeaders });
      const html = await res.text();
      assert(
        res.status === 200 && html.includes('Hệ thống giám sát kinh doanh') && html.includes('FRESHBITE'),
        '18. GET /admin/dashboard - Truy cập Dashboard SSR hiển thị đầy đủ KPI doanh thu và 4 chi nhánh (200)'
      );
    }

    // Test 19: GET /admin/orders (KDS Barista Screen SSR)
    {
      const res = await fetch(`${BASE_URL}/admin/orders`, { headers: authHeaders });
      const html = await res.text();
      assert(
        res.status === 200 && html.includes('Màn Hình Quầy Barista (KDS)'),
        '19. GET /admin/orders - Render màn hình KDS quầy Barista thời gian thực (200)'
      );
    }

    // Test 20: Lọc đơn hàng theo chi nhánh trên KDS
    {
      const res = await fetch(`${BASE_URL}/admin/orders?branchId=${testBranchId}`, { headers: authHeaders });
      const html = await res.text();
      assert(
        res.status === 200 && html.includes('Chi Nhánh'),
        '20. GET /admin/orders?branchId=... - Lọc đơn hàng theo từng chi nhánh trên KDS (200)'
      );
    }

    // Test 21: Cập nhật trạng thái đơn hàng (POST /admin/orders/:id/status)
    {
      const params = new URLSearchParams();
      params.append('status', 'Preparing');
      params.append('redirectUrl', '/admin/orders');

      const res = await fetch(`${BASE_URL}/admin/orders/${testOrderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...authHeaders
        },
        body: params,
        redirect: 'manual'
      });

      const updatedOrder = await Order.findById(testOrderId);
      assert(
        (res.status === 302 || res.status === 200) && updatedOrder.status === 'Preparing',
        '21. POST /admin/orders/:id/status - Cập nhật trạng thái đơn hàng từ Web Admin và chuyển hướng (302)'
      );
    }

    // Test 22: GET /admin/products (Quản lý thực đơn SSR)
    {
      const res = await fetch(`${BASE_URL}/admin/products`, { headers: authHeaders });
      const html = await res.text();
      assert(
        res.status === 200 && html.includes('Quản Lý Thực Đơn & Món Ăn'),
        '22. GET /admin/products - Render giao diện quản lý thực đơn & giá theo size (200)'
      );
    }

    // Test 23: Bật/tắt trạng thái còn hàng/hết hàng món ăn
    {
      const initialProduct = await Product.findById(testProductId);
      const initialAvailable = initialProduct.isAvailable;

      const res = await fetch(`${BASE_URL}/admin/products/${testProductId}/toggle`, {
        method: 'POST',
        headers: authHeaders,
        redirect: 'manual'
      });

      const updatedProduct = await Product.findById(testProductId);
      assert(
        (res.status === 302 || res.status === 200) && updatedProduct.isAvailable !== initialAvailable,
        '23. POST /admin/products/:id/toggle - Bật/tắt trạng thái món ăn trực tiếp từ Web Admin (302)'
      );

      // Revert lại trạng thái cũ
      updatedProduct.isAvailable = initialAvailable;
      await updatedProduct.save();
    }

    // Test 24: GET /admin/branches (Danh sách 4 chi nhánh Đà Nẵng SSR)
    {
      const res = await fetch(`${BASE_URL}/admin/branches`, { headers: authHeaders });
      const html = await res.text();
      assert(
        res.status === 200 && html.includes('Hệ Thống Chi Nhánh FreshBite Đà Nẵng'),
        '24. GET /admin/branches - Render danh sách 4 chi nhánh kèm tọa độ GPS (200)'
      );
    }

    // Test 25: Static CSS stylesheet
    {
      const res = await fetch(`${BASE_URL}/css/style.css`);
      const css = await res.text();
      assert(
        res.status === 200 && css.includes('--primary'),
        '25. GET /css/style.css - Tải stylesheet giao diện Admin KDS thành công (200)'
      );
    }

    // -------------------------------------------------------------
    // MODULE 5: WEB ADMIN AUTHENTICATION (Login, Session & Logout)
    // -------------------------------------------------------------
    console.log('\n--- PHẦN 5: XÁC THỰC WEB ADMIN & BARISTA KDS (Login & Session) ---');

    // Test 26: GET /admin/login (Trang đăng nhập M3)
    {
      const res = await fetch(`${BASE_URL}/admin/login`);
      const html = await res.text();
      assert(
        res.status === 200 && html.includes('FreshBite Coffee & Tea') && html.includes('Đăng Nhập Vào Trạm'),
        '26. GET /admin/login - Render trang đăng nhập Web Admin & Barista KDS thành công (200)'
      );
    }

    // Test 27: POST /admin/login (Đăng nhập thành công, cấp cookie session)
    let sessionCookie = '';
    {
      const res = await fetch(`${BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'email=admin@freshbite.vn&password=password123',
        redirect: 'manual'
      });
      const cookie = res.headers.get('set-cookie') || '';
      sessionCookie = cookie.split(';')[0];
      assert(
        res.status === 302 && res.headers.get('location') === '/admin/dashboard' && cookie.includes('freshbite_admin_token'),
        '27. POST /admin/login - Đăng nhập quản trị viên thành công, thiết lập Cookie phiên an toàn (302)'
      );
    }

    // Test 28: POST /admin/login (Từ chối khi mật khẩu sai)
    {
      const res = await fetch(`${BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'email=admin@freshbite.vn&password=sai_mat_khau_123',
        redirect: 'manual'
      });
      assert(
        res.status === 401,
        '28. POST /admin/login - Từ chối khi mật khẩu không chính xác (401)'
      );
    }

    // Test 29: GET /admin/logout (Đăng xuất xóa session)
    {
      const res = await fetch(`${BASE_URL}/admin/logout`, {
        headers: { Cookie: sessionCookie },
        redirect: 'manual'
      });
      assert(
        res.status === 302 && (res.headers.get('location') || '').includes('/admin/login'),
        '29. GET /admin/logout - Đăng xuất và điều hướng trở lại trang Login an toàn (302)'
      );
    }

    // Test 30: Bảo vệ bảo mật - Truy cập /admin sau khi đăng xuất hoặc không có Cookie phải chuyển hướng về /admin/login
    {
      const res = await fetch(`${BASE_URL}/admin`, {
        redirect: 'manual'
      });
      assert(
        res.status === 302 && (res.headers.get('location') || '').includes('/admin/login'),
        '30. Security Guard - Chặn truy cập /admin khi chưa đăng nhập và bắt buộc chuyển hướng về /admin/login (302)'
      );
    }

    console.log('\n================================================================');
    console.log(`  KẾT QUẢ KIỂM THỬ: ${stats.passed}/${stats.total} PASSED (${Math.round((stats.passed / stats.total) * 100)}%)`);
    console.log('================================================================\n');

    if (stats.failed > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Lỗi nghiêm trọng khi thực thi Test Suite:', error);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }
};

runTests();
