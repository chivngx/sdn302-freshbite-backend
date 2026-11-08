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

    // Khoi dong test server tren dynamic port ngau nhien
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    BASE_URL = `http://localhost:${port}`;
    console.log(` -> Test server đang chạy tại: ${BASE_URL}\n`);

    // Chuan bi tai khoan test admin
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

    // Chuan bi Branch, Product, Order test
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
        orderCode: `FB-${Math.floor(10000 + Math.random() * 90000)}`,
        userId: adminUser._id,
        branchId: branch._id,
        items: [
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: 2,
            size: 'M'
          }
        ],
        subtotal: product.price * 2,
        discountAmount: 0,
        totalAmount: product.price * 2,
        paymentMethod: 'CASH_AT_COUNTER',
        paymentStatus: 'PENDING',
        status: 'Pending'
      });
    }
    testOrderId = order._id.toString();

    // -------------------------------------------------------------
    // MODULE 1: MULTER FILE UPLOAD (Slot 12)
    // -------------------------------------------------------------
    console.log('--- PHẦN 1: MULTER FILE UPLOAD TĨNH (/api/uploads) ---');

    // Test 1: Upload single image hop le
    {
      const formData = new FormData();
      const fakeImageBytes = Buffer.from('fake-png-image-binary-stream-for-freshbite-testing');
      const blob = new Blob([fakeImageBytes], { type: 'image/png' });
      formData.append('image', blob, 'freshbite_test_coffee.png');

      const res = await fetch(`${BASE_URL}/api/uploads/single`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`
        },
        body: formData
      });
      const data = await res.json();
      assert(res.status === 201 && data.success && data.data.url, '1. POST /api/uploads/single - Upload 1 ảnh tĩnh thành công (201)');
      if (data.data && data.data.filename) {
        uploadedFilename = data.data.filename;
      }
    }

    // Test 2: Truy cap truc tiep file upload qua static path /uploads/...
    {
      const res = await fetch(`${BASE_URL}/uploads/${uploadedFilename}`);
      assert(res.status === 200, `2. GET /uploads/${uploadedFilename} - Client tải ảnh tĩnh trực tiếp thành công (200)`);
    }

    // Test 3: Upload voi route alias POST /api/uploads
    {
      const formData = new FormData();
      const fakeImageBytes = Buffer.from('fake-jpeg-image-bytes');
      const blob = new Blob([fakeImageBytes], { type: 'image/jpeg' });
      formData.append('image', blob, 'freshbite_banner.jpg');

      const res = await fetch(`${BASE_URL}/api/uploads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`
        },
        body: formData
      });
      const data = await res.json();
      assert(res.status === 201 && data.success, '3. POST /api/uploads - Upload qua alias route thành công (201)');
    }

    // Test 4: Upload nhieu anh cung luc (multiple)
    {
      const formData = new FormData();
      const blob1 = new Blob([Buffer.from('img1')], { type: 'image/png' });
      const blob2 = new Blob([Buffer.from('img2')], { type: 'image/png' });
      formData.append('images', blob1, 'product_thumb_1.png');
      formData.append('images', blob2, 'product_thumb_2.png');

      const res = await fetch(`${BASE_URL}/api/uploads/multiple`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`
        },
        body: formData
      });
      const data = await res.json();
      assert(res.status === 201 && Array.isArray(data.data) && data.data.length === 2, '4. POST /api/uploads/multiple - Upload 2 ảnh đồng thời thành công (201)');
    }

    // Test 5: Tu choi upload file khong phai hinh anh (File filter validation)
    {
      const formData = new FormData();
      const fakeTextBlob = new Blob([Buffer.from('virus_script.sh')], { type: 'application/x-sh' });
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
    // MODULE 3: SERVER-SIDE RENDERING (EJS Web Admin & KDS - Slot 7)
    // -------------------------------------------------------------
    console.log('\n--- PHẦN 3: SERVER-SIDE RENDERING EJS WEB ADMIN (Slot 7) ---');

    // Test 13: GET /admin (Dashboard SSR)
    {
      const res = await fetch(`${BASE_URL}/admin`);
      const contentType = res.headers.get('content-type') || '';
      const html = await res.text();
      assert(
        res.status === 200 && contentType.includes('text/html') && html.includes('Bảng Quản Trị & Doanh Thu Quầy'),
        '13. GET /admin - Render trang Dashboard SSR với mã HTML hoàn chỉnh (200)'
      );
    }

    // Test 14: GET /admin/dashboard
    {
      const res = await fetch(`${BASE_URL}/admin/dashboard`);
      const html = await res.text();
      assert(
        res.status === 200 && html.includes('Hệ thống giám sát kinh doanh'),
        '14. GET /admin/dashboard - Truy cập Dashboard qua đường dẫn alias thành công (200)'
      );
    }

    // Test 15: GET /admin/orders (KDS Barista Screen SSR)
    {
      const res = await fetch(`${BASE_URL}/admin/orders`);
      const html = await res.text();
      assert(
        res.status === 200 && html.includes('Màn Hình Quầy Barista (KDS)'),
        '15. GET /admin/orders - Render màn hình KDS quầy Barista thời gian thực (200)'
      );
    }

    // Test 16: Loc don hang theo chi nhanh tren man hinh KDS
    {
      const res = await fetch(`${BASE_URL}/admin/orders?branchId=${testBranchId}`);
      const html = await res.text();
      assert(
        res.status === 200 && html.includes('Chi Nhánh'),
        '16. GET /admin/orders?branchId=... - Lọc đơn hàng theo từng chi nhánh trên KDS (200)'
      );
    }

    // Test 17: Cap nhat trang thai don hang truc tiep tu Web Admin (POST /admin/orders/:id/status)
    {
      const params = new URLSearchParams();
      params.append('status', 'Preparing');
      params.append('redirectUrl', '/admin/orders');

      const res = await fetch(`${BASE_URL}/admin/orders/${testOrderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params,
        redirect: 'manual'
      });

      const updatedOrder = await Order.findById(testOrderId);
      assert(
        (res.status === 302 || res.status === 200) && updatedOrder.status === 'Preparing',
        '17. POST /admin/orders/:id/status - Cập nhật trạng thái đơn hàng từ Web Admin và chuyển hướng (302)'
      );
    }

    // Test 18: GET /admin/products (Quan ly thuc don SSR)
    {
      const res = await fetch(`${BASE_URL}/admin/products`);
      const html = await res.text();
      assert(
        res.status === 200 && html.includes('Quản Lý Thực Đơn & Món Ăn'),
        '18. GET /admin/products - Render giao diện quản lý thực đơn & giá theo size (200)'
      );
    }

    // Test 19: Bat/tat trang thai con hang/het hang mon an tu Web Admin
    {
      const initialProduct = await Product.findById(testProductId);
      const initialAvailable = initialProduct.isAvailable;

      const res = await fetch(`${BASE_URL}/admin/products/${testProductId}/toggle`, {
        method: 'POST',
        redirect: 'manual'
      });

      const updatedProduct = await Product.findById(testProductId);
      assert(
        (res.status === 302 || res.status === 200) && updatedProduct.isAvailable !== initialAvailable,
        '19. POST /admin/products/:id/toggle - Bật/tắt trạng thái món ăn trực tiếp từ Web Admin (302)'
      );

      // Revert lại trạng thái cũ
      updatedProduct.isAvailable = initialAvailable;
      await updatedProduct.save();
    }

    // Test 20: GET /admin/branches (Danh sach 4 chi nhanh Da Nang SSR)
    {
      const res = await fetch(`${BASE_URL}/admin/branches`);
      const html = await res.text();
      assert(
        res.status === 200 && html.includes('Hệ Thống Chi Nhánh FreshBite Đà Nẵng'),
        '20. GET /admin/branches - Render danh sách 4 chi nhánh kèm tọa độ GPS (200)'
      );
    }

    // Test 21: Static CSS stylesheet
    {
      const res = await fetch(`${BASE_URL}/css/style.css`);
      const css = await res.text();
      assert(
        res.status === 200 && css.includes('--primary'),
        '21. GET /css/style.css - Tải stylesheet giao diện Admin KDS thành công (200)'
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
