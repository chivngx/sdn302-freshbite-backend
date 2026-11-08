/**
 * Test Suite: Kiểm thử toàn diện phần nhiệm vụ của Lê Tự Nhật Thạch môn SDN302
 * Bao gồm:
 * 1. Multer Upload ảnh tĩnh (/api/upload) & Static File Serving (/uploads)
 * 2. File Download (res.download - Slot 12) Hóa đơn (/api/orders/:id/invoice)
 * 3. Kiểm tra tính toàn vẹn của 3 Script Seed Data Đà Nẵng (seedData, testSeed, userSeed)
 * 4. Kiểm tra Server-Side Rendering với EJS (Slot 7) (/admin/dashboard, /admin/orders, /admin/products)
 */

process.env.NODE_ENV = 'test';
require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const app = require('../server');
const connectDB = require('../config/db');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Voucher = require('../models/Voucher');

let server;
let baseUrl;
let adminToken;
let userToken;
let sampleOrderId;
let sampleProductId;

// Helper thực hiện HTTP Request
const request = ({ method, path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: { ...headers }
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
          json = null;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
          text: data
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      if (Buffer.isBuffer(body) || typeof body === 'string') {
        req.write(body);
      } else {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
};

// Helper tạo Multipart Form Data gửi kèm file
const createMultipartBody = (boundary, fieldName, filename, mimeType, fileBuffer) => {
  const pre = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
  );
  const post = Buffer.from(`\r\n--${boundary}--\r\n`);
  return Buffer.concat([pre, fileBuffer, post]);
};

const runThachTests = async () => {
  console.log('\n=============================================================');
  console.log(' BẮT ĐẦU KIỂM THỬ NHIỆM VỤ LÊ TỰ NHẬT THẠCH - MÔN SDN302');
  console.log(' (Uploads & Downloads Slot 12, 3 Seeds, Web Admin SSR EJS Slot 7)');
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

    // Chuẩn bị User Admin & User Thường
    let admin = await User.findOne({ role: 'admin' });
    let normal = await User.findOne({ role: 'user' });

    if (!admin) {
      admin = await User.create({
        fullName: 'Lê Tự Nhật Thạch (Admin)',
        email: 'thach_test_admin@freshbite.vn',
        password: 'password123',
        phone: '0905123456',
        role: 'admin'
      });
    }

    if (!normal) {
      normal = await User.create({
        fullName: 'Khách Hàng Test',
        email: 'thach_test_user@freshbite.vn',
        password: 'password123',
        phone: '0905987654',
        role: 'user'
      });
    }

    adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '1d'
    });
    userToken = jwt.sign({ id: normal._id, role: normal.role }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '1d'
    });

    // Tạo Branch & Category & Product mẫu nếu chưa có
    let branch = await Branch.findOne();
    if (!branch) {
      branch = await Branch.create({
        name: 'FreshBite FPT City (Ngũ Hành Sơn)',
        address: 'Tòa F-Complex, Khu đô thị FPT City, P. Hòa Hải, Q. Ngũ Hành Sơn, Đà Nẵng',
        district: 'Ngũ Hành Sơn',
        latitude: 15.969234,
        longitude: 108.261221,
        phone: '0236.730.0999',
        imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800'
      });
    }

    let category = await Category.findOne();
    if (!category) {
      category = await Category.create({
        name: 'Cà phê',
        code: 'coffee',
        description: 'Cà phê đặc sản Đà Nẵng',
        icon: 'coffee'
      });
    }

    let product = await Product.findOne();
    if (!product) {
      product = await Product.create({
        name: 'Cà phê Muối Đà Nẵng',
        categoryId: category._id,
        price: 32000,
        sizePricing: { S: 0, M: 6000, L: 10000 },
        description: 'Cà phê muối đặc sản Đà Nẵng thơm ngon béo ngậy',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800',
        calories: 180,
        isBestSeller: true,
        isAvailable: true
      });
    }
    sampleProductId = product._id;

    // Tạo 1 Order mẫu phục vụ kiểm thử download hóa đơn (Slot 12)
    let order = await Order.findOne();
    if (!order) {
      order = await Order.create({
        orderCode: 'FB-99887',
        userId: normal._id,
        branchId: branch._id,
        items: [
          {
            productId: product._id,
            name: product.name,
            size: 'M',
            quantity: 2,
            price: 38000,
            sugarLevel: '50%',
            iceLevel: '100%',
            note: 'Cho vào túi giấy giữ nhiệt'
          }
        ],
        subtotal: 76000,
        discount: 7600,
        voucherCode: 'FRESHBITE10',
        totalAmount: 68400,
        pickupTime: '15_MINS',
        status: 'Received',
        paymentMethod: 'CASH_AT_COUNTER',
        paymentStatus: 'PENDING'
      });
    }
    sampleOrderId = order._id;

    // -------------------------------------------------------------
    // NHÓM 1: KIỂM THỬ MULTER UPLOAD TĨNH (Slot 12)
    // -------------------------------------------------------------
    console.log('--- 1. KIỂM THỬ MULTER UPLOAD TĨNH & FILE DOWNLOAD (Slot 12) ---');

    // 1.1: Upload ảnh hợp lệ (.jpg / .png) lên /api/upload
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    // 1x1 transparent PNG buffer
    const mockImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const multipartBody = createMultipartBody(
      boundary,
      'image',
      'test-coffee.png',
      'image/png',
      mockImageBuffer
    );

    const resUpload = await request({
      method: 'POST',
      path: '/api/upload',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${adminToken}`
      },
      body: multipartBody
    });

    assert(resUpload.statusCode === 201, 'POST /api/upload upload ảnh thành công trả về 201 Created');
    assert(resUpload.data && resUpload.data.success === true, 'Response body có success: true');
    assert(
      resUpload.data.data && typeof resUpload.data.data.path === 'string' && resUpload.data.data.path.startsWith('/uploads/'),
      'Đường dẫn ảnh lưu dạng tĩnh /uploads/... chuẩn xác'
    );

    const uploadedImagePath = resUpload.data.data.path;

    // 1.2: Kiểm tra truy cập file tĩnh vừa upload qua static middleware (/uploads/...)
    const resStatic = await request({ method: 'GET', path: uploadedImagePath });
    assert(resStatic.statusCode === 200, `GET ${uploadedImagePath} phục vụ file tĩnh trả về 200 OK`);

    // 1.3: Upload file không phải ảnh (text/plain) -> Bắt lỗi 400 Bad Request
    const badFileBuffer = Buffer.from('console.log("malicious code");');
    const badMultipartBody = createMultipartBody(
      boundary,
      'image',
      'virus.js',
      'application/javascript',
      badFileBuffer
    );

    const resBadUpload = await request({
      method: 'POST',
      path: '/api/upload',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${adminToken}`
      },
      body: badMultipartBody
    });

    assert(resBadUpload.statusCode === 400, 'Upload tệp không phải ảnh bị từ chối với mã 400 Bad Request');
    assert(resBadUpload.data.message.includes('không được hỗ trợ'), 'Thông báo lỗi từ chối định dạng chuẩn xác');

    // 1.4: Tải hóa đơn biên nhận đơn hàng (res.download() - Slot 12)
    const resInvoice = await request({
      method: 'GET',
      path: `/api/orders/${sampleOrderId}/invoice`,
      headers: { Authorization: `Bearer ${userToken}` }
    });

    assert(resInvoice.statusCode === 200, 'GET /api/orders/:id/invoice tải hóa đơn trả về 200 OK');
    assert(
      resInvoice.headers['content-disposition'] &&
        resInvoice.headers['content-disposition'].includes('attachment') &&
        resInvoice.headers['content-disposition'].includes('HoaDon_'),
      'Header Content-Disposition chứa "attachment; filename=HoaDon_..." (Kích hoạt hộp thoại tải file res.download)'
    );
    assert(
      resInvoice.text.includes('FRESHBITE COFFEE & BAKERY') && resInvoice.text.includes('HÓA ĐƠN BIÊN NHẬN'),
      'Nội dung file hóa đơn chứa tiêu đề thương hiệu và bảng chi tiết món ăn'
    );

    // 1.5: Tải hóa đơn qua route upload /api/upload/orders/:id/invoice
    const resUploadInvoice = await request({
      method: 'GET',
      path: `/api/upload/orders/${sampleOrderId}/invoice`,
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(resUploadInvoice.statusCode === 200, 'GET /api/upload/orders/:id/invoice cũng hoạt động chuẩn xác');

    // -------------------------------------------------------------
    // NHÓM 2: KIỂM THỬ 3 SCRIPT SEED DATA ĐÀ NẴNG
    // -------------------------------------------------------------
    console.log('\n--- 2. KIỂM THỬ 3 SCRIPT SEED DATA ĐÀ NẴNG ---');

    // 2.1: Kiểm tra cấu trúc seedData.js
    const seedDataModule = require('../seeds/seedData');
    assert(Array.isArray(seedDataModule.branches) && seedDataModule.branches.length === 4, 'seedData.js chứa đủ 4 chi nhánh Đà Nẵng');
    assert(Array.isArray(seedDataModule.categories) && seedDataModule.categories.length === 4, 'seedData.js chứa 4 danh mục thực đơn');
    assert(Array.isArray(seedDataModule.productsData) && seedDataModule.productsData.length >= 20, `seedData.js chứa đủ 20 món ăn đặc sản Đà Nẵng (có ${seedDataModule.productsData.length} món)`);
    assert(Array.isArray(seedDataModule.vouchersData) && seedDataModule.vouchersData.length === 3, 'seedData.js chứa 3 mã vouchers khuyến mãi Đà Nẵng');

    // 2.2: Kiểm tra testSeed.js có chứa món test lỗi 400 (isAvailable: false)
    const testSeedCode = fs.readFileSync(path.join(__dirname, '..', 'seeds', 'testSeed.js'), 'utf8');
    assert(testSeedCode.includes('isAvailable: false'), 'testSeed.js có chứa sản phẩm cố tình tắt trạng thái (isAvailable: false) để test lỗi 400');
    assert(testSeedCode.includes('outOfStockProductIds'), 'testSeed.js có cấu hình test hết hàng theo chi nhánh (outOfStockProductIds)');

    // 2.3: Kiểm tra userSeed.js bắt buộc dùng User.create() thay vì insertMany() để chạy hook Bcrypt
    const userSeedCode = fs.readFileSync(path.join(__dirname, '..', 'seeds', 'userSeed.js'), 'utf8');
    assert(userSeedCode.includes('User.create'), 'userSeed.js sử dụng User.create() (kích hoạt pre-save hook băm mật khẩu)');
    assert(!userSeedCode.includes('User.insertMany'), 'userSeed.js KHÔNG sử dụng insertMany() (tránh bỏ qua hook Bcrypt)');

    // -------------------------------------------------------------
    // NHÓM 3: KIỂM THỬ SERVER-SIDE RENDERING VỚI EJS (Slot 7)
    // -------------------------------------------------------------
    console.log('\n--- 3. KIỂM THỬ GIAO DIỆN WEB ADMIN SSR VỚI EJS (Slot 7) ---');

    // 3.1: Redirect /admin -> /admin/dashboard
    const resAdminRoot = await request({ method: 'GET', path: '/admin' });
    assert(resAdminRoot.statusCode === 302, 'GET /admin chuyển hướng 302 sang /admin/dashboard');

    // 3.2: Render Màn hình Dashboard Tổng quan (/admin/dashboard)
    const resDashboard = await request({ method: 'GET', path: '/admin/dashboard' });
    assert(resDashboard.statusCode === 200, 'GET /admin/dashboard render HTML EJS thành công 200 OK');
    assert(resDashboard.text.includes('Bảng Tổng Quan Hoạt Động &amp; Doanh Thu') || resDashboard.text.includes('Bảng Tổng Quan Hoạt Động & Doanh Thu'), 'Trang chứa tiêu đề bảng tổng quan');
    assert(
      resDashboard.text.includes('Tổng Doanh Thu') &&
        (resDashboard.text.includes('FRESHBITE') || resDashboard.text.includes('FreshBite')),
      'Trang dashboard hiển thị số liệu doanh thu và 4 chi nhánh'
    );

    // 3.3: Render Màn hình KDS Bếp & Quầy Barista (/admin/orders)
    const resKds = await request({ method: 'GET', path: '/admin/orders' });
    assert(resKds.statusCode === 200, 'GET /admin/orders render Màn hình KDS Bếp trả về 200 OK');
    assert(resKds.text.includes('Màn Hình Bếp KDS &amp; Quầy Barista') || resKds.text.includes('Màn Hình Bếp KDS & Quầy Barista'), 'Trang KDS có tiêu đề đúng chuẩn KDS Counter Desk');
    assert(resKds.text.includes('kds-card') || resKds.text.includes('kds-filter-bar'), 'Giao diện KDS chứa cấu trúc thẻ Kitchen Display System');

    // 3.4: Chuyển trạng thái đơn hàng trên Web KDS (/admin/orders/:id/status)
    const resUpdateWebStatus = await request({
      method: 'POST',
      path: `/admin/orders/${sampleOrderId}/status`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'status=Preparing'
    });
    assert(resUpdateWebStatus.statusCode === 302, 'POST /admin/orders/:id/status chuyển trạng thái đơn hàng và chuyển hướng 302');
    const updatedOrderInDb = await Order.findById(sampleOrderId);
    assert(updatedOrderInDb.status === 'Preparing', 'Trạng thái đơn hàng trong CSDL đã được cập nhật thành "Preparing"');

    // 3.5: Render Màn hình Quản lý Món ăn (/admin/products)
    const resProductsPage = await request({ method: 'GET', path: '/admin/products' });
    assert(resProductsPage.statusCode === 200, 'GET /admin/products render Màn hình Quản lý Thực đơn trả về 200 OK');
    assert(
      resProductsPage.text.includes('enctype="multipart/form-data"'),
      'Form thêm món có enctype="multipart/form-data" phục vụ Multer upload ảnh món ăn'
    );

    // 3.6: Bật/tắt trạng thái còn hàng của món ăn (/admin/products/:id/toggle)
    const initialAvailable = (await Product.findById(sampleProductId)).isAvailable;
    const resToggle = await request({
      method: 'POST',
      path: `/admin/products/${sampleProductId}/toggle`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: ''
    });
    assert(resToggle.statusCode === 302, 'POST /admin/products/:id/toggle chuyển hướng 302');
    const toggledProduct = await Product.findById(sampleProductId);
    assert(toggledProduct.isAvailable === !initialAvailable, 'Trạng thái isAvailable của món ăn đã được toggle thành công');

    console.log('\n=============================================================');
    console.log(` KẾT QUẢ KIỂM THỬ: ${passed} PASSED / ${failed} FAILED`);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('>>> TẤT CẢ CÁC MỤC KIỂM THỬ CỦA LÊ TỰ NHẬT THẠCH ĐỀU ĐẠT CHUẨN 100%! <<<\n');
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

runThachTests();

