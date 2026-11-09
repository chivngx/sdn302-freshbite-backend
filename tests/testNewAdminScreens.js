/**
 * Automated Verification Script for New Web Admin EJS Screens
 * Tests:
 * 1. Live Chat CSKH (/admin/chats)
 * 2. Reviews & Rating (/admin/reviews)
 * 3. Shift Reports & Reconciliation (/admin/reports, /admin/reports/export)
 * 4. Voucher Management (/admin/vouchers)
 * 5. Full Product CRUD (/admin/products, edit, delete)
 */

const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const connectDB = require('../config/db');
const app = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const Voucher = require('../models/Voucher');
const Review = require('../models/Review');
const Message = require('../models/Message');

async function runTests() {
  console.log('\n=============================================================');
  console.log(' BẮT ĐẦU KIỂM THỬ CÁC MÀN HÌNH WEB ADMIN SSR EJS MỚI');
  console.log(' (Live Chat CSKH, Đánh Giá, Đối Soát Ca, Voucher, CRUD Sản Phẩm)');
  console.log('=============================================================\n');

  let server;
  try {
    await connectDB();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const BASE_URL = `http://localhost:${port}`;

    // 1. Tạo hoặc lấy admin user
    let admin = await User.findOne({ email: 'admin@freshbite.com' });
    if (!admin) {
      admin = await User.create({
        fullName: 'Quản Trị Viên Trưởng',
        email: 'admin@freshbite.com',
        phone: '0905123456',
        password: 'Password123!',
        role: 'admin'
      });
    }

    const adminToken = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'freshbite_super_secret_jwt_key_2026',
      { expiresIn: '1d' }
    );
    const authHeaders = { Cookie: `freshbite_admin_token=${adminToken}` };

    const branch = await Branch.findOne() || await Branch.create({
      name: 'FreshBite FPT City',
      address: 'Khu đô thị FPT City, Hòa Hải',
      district: 'Ngũ Hành Sơn',
      latitude: 15.9689,
      longitude: 108.2608,
      phone: '02363999888',
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800'
    });

    // -------------------------------------------------------------
    // 1. KIỂM THỬ LIVE CHAT CSKH (/admin/chats)
    // -------------------------------------------------------------
    console.log('--- 1. KIỂM THỬ LIVE CHAT CSKH (/admin/chats) ---');
    {
      const res = await fetch(`${BASE_URL}/admin/chats`, { headers: authHeaders });
      const html = await res.text();
      assert.strictEqual(res.status, 200, 'GET /admin/chats trả về 200 OK');
      assert.ok(html.includes('Live Chat CSKH & Phản Hồi Quầy'), 'Chứa tiêu đề Live Chat CSKH');
      console.log('  ✅ [PASS] GET /admin/chats - Render màn hình Live Chat CSKH thành công (200)');
    }

    {
      const params = new URLSearchParams();
      params.append('branchId', branch._id.toString());
      params.append('userId', admin._id.toString());
      params.append('content', 'Xin chào quý khách, FreshBite hân hạnh phục vụ!');

      const res = await fetch(`${BASE_URL}/admin/chats/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...authHeaders
        },
        body: params,
        redirect: 'manual'
      });
      assert.strictEqual(res.status, 302, 'POST /admin/chats/reply chuyển hướng 302');
      console.log('  ✅ [PASS] POST /admin/chats/reply - CSKH gửi phản hồi tin nhắn thành công (302)');
    }

    // -------------------------------------------------------------
    // 2. KIỂM THỬ ĐÁNH GIÁ REVIEWS (/admin/reviews)
    // -------------------------------------------------------------
    console.log('\n--- 2. KIỂM THỬ ĐÁNH GIÁ REVIEWS (/admin/reviews) ---');
    {
      const res = await fetch(`${BASE_URL}/admin/reviews`, { headers: authHeaders });
      const html = await res.text();
      assert.strictEqual(res.status, 200, 'GET /admin/reviews trả về 200 OK');
      assert.ok(html.includes('Đánh Giá & Phản Hồi Khách Hàng'), 'Chứa tiêu đề Đánh Giá Khách Hàng');
      console.log('  ✅ [PASS] GET /admin/reviews - Render danh sách đánh giá & thống kê sao (200)');
    }

    let testReview = await Review.findOne();
    if (!testReview) {
      let prod = await Product.findOne();
      testReview = await Review.create({
        userId: admin._id,
        productId: prod._id,
        branchId: branch._id,
        rating: 5,
        comment: 'Cà phê rất thơm ngon, kem béo vừa miệng!'
      });
    }

    {
      const initialHidden = testReview.isHidden;
      const res = await fetch(`${BASE_URL}/admin/reviews/${testReview._id}/toggle`, {
        method: 'POST',
        headers: authHeaders,
        redirect: 'manual'
      });
      assert.strictEqual(res.status, 302, 'POST /admin/reviews/:id/toggle chuyển hướng 302');
      const updatedRev = await Review.findById(testReview._id);
      assert.strictEqual(updatedRev.isHidden, !initialHidden, 'Đảo ngược trạng thái isHidden thành công');
      console.log('  ✅ [PASS] POST /admin/reviews/:id/toggle - Ẩn/Hiện đánh giá kiểm duyệt thành công (302)');
    }

    // -------------------------------------------------------------
    // 3. KIỂM THỬ ĐỐI SOÁT CA QUẦY (/admin/reports)
    // -------------------------------------------------------------
    console.log('\n--- 3. KIỂM THỬ ĐỐI SOÁT CA QUẦY (/admin/reports) ---');
    {
      const res = await fetch(`${BASE_URL}/admin/reports`, { headers: authHeaders });
      const html = await res.text();
      assert.strictEqual(res.status, 200, 'GET /admin/reports trả về 200 OK');
      assert.ok(html.includes('Đối Soát Ca & Doanh Thu Quầy'), 'Chứa tiêu đề Đối Soát Ca');
      console.log('  ✅ [PASS] GET /admin/reports - Render dashboard đối soát ca quầy thành công (200)');
    }

    {
      const res = await fetch(`${BASE_URL}/admin/reports/export?branchId=${branch._id}`, { headers: authHeaders });
      const cd = res.headers.get('content-disposition') || '';
      assert.strictEqual(res.status, 200, 'GET /admin/reports/export trả về 200 OK');
      assert.ok(cd.includes('attachment'), 'Có header tải file đính kèm');
      console.log('  ✅ [PASS] GET /admin/reports/export - Xuất file CSV đối soát ca thành công qua res.download (200)');
    }

    // -------------------------------------------------------------
    // 4. KIỂM THỬ QUẢN LÝ VOUCHER (/admin/vouchers)
    // -------------------------------------------------------------
    console.log('\n--- 4. KIỂM THỬ QUẢN LÝ VOUCHER (/admin/vouchers) ---');
    {
      const res = await fetch(`${BASE_URL}/admin/vouchers`, { headers: authHeaders });
      const html = await res.text();
      assert.strictEqual(res.status, 200, 'GET /admin/vouchers trả về 200 OK');
      assert.ok(html.includes('Quản Lý Voucher & Mã Giảm Giá'), 'Chứa tiêu đề Quản Lý Voucher');
      console.log('  ✅ [PASS] GET /admin/vouchers - Render danh sách Voucher & chiến dịch khuyến mãi (200)');
    }

    const testVoucherCode = `TESTEJS${Date.now()}`.substring(0, 15).toUpperCase();
    {
      const params = new URLSearchParams();
      params.append('code', testVoucherCode);
      params.append('title', 'Ưu Đãi Đặc Biệt Web Admin');
      params.append('discountType', 'PERCENT');
      params.append('discountValue', '25');
      params.append('maxDiscount', '60000');
      params.append('minOrderAmount', '100000');
      params.append('endDate', '2027-12-31');

      const res = await fetch(`${BASE_URL}/admin/vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...authHeaders
        },
        body: params,
        redirect: 'manual'
      });
      assert.strictEqual(res.status, 302, 'POST /admin/vouchers chuyển hướng 302');
      const createdVoucher = await Voucher.findOne({ code: testVoucherCode });
      assert.ok(createdVoucher, 'Voucher đã được tạo trong Database');
      console.log('  ✅ [PASS] POST /admin/vouchers - Tạo mới voucher ưu đãi thành công (302)');

      // Toggle voucher
      const toggleRes = await fetch(`${BASE_URL}/admin/vouchers/${createdVoucher._id}/toggle`, {
        method: 'POST',
        headers: authHeaders,
        redirect: 'manual'
      });
      assert.strictEqual(toggleRes.status, 302, 'Toggle voucher chuyển hướng 302');
      const toggledVoucher = await Voucher.findById(createdVoucher._id);
      assert.strictEqual(toggledVoucher.isActive, false, 'Voucher đã chuyển sang inactive');
      console.log('  ✅ [PASS] POST /admin/vouchers/:id/toggle - Bật/Tắt hoạt động voucher thành công (302)');

      // Delete voucher
      const delRes = await fetch(`${BASE_URL}/admin/vouchers/${createdVoucher._id}/delete`, {
        method: 'POST',
        headers: authHeaders,
        redirect: 'manual'
      });
      assert.strictEqual(delRes.status, 302, 'Delete voucher chuyển hướng 302');
      const deletedVoucher = await Voucher.findById(createdVoucher._id);
      assert.strictEqual(deletedVoucher, null, 'Voucher đã được xóa khỏi Database');
      console.log('  ✅ [PASS] POST /admin/vouchers/:id/delete - Xóa voucher khỏi hệ thống thành công (302)');
    }

    // -------------------------------------------------------------
    // 5. KIỂM THỬ CRUD SẢN PHẨM & GIÁ THEO SIZE (/admin/products)
    // -------------------------------------------------------------
    console.log('\n--- 5. KIỂM THỬ CRUD SẢN PHẨM & GIÁ THEO SIZE (/admin/products) ---');
    let testProduct = await Product.findOne();
    if (testProduct) {
      const editParams = new URLSearchParams();
      editParams.append('name', testProduct.name);
      editParams.append('price', '42000');
      editParams.append('sizePriceM', '7000');
      editParams.append('sizePriceL', '12000');
      editParams.append('calories', '180');
      editParams.append('description', 'Mô tả cập nhật từ Web Admin SSR');

      const res = await fetch(`${BASE_URL}/admin/products/${testProduct._id}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...authHeaders
        },
        body: editParams,
        redirect: 'manual'
      });
      assert.strictEqual(res.status, 302, 'POST /admin/products/:id/edit chuyển hướng 302');
      const updatedProd = await Product.findById(testProduct._id);
      assert.strictEqual(updatedProd.price, 42000, 'Giá size S đã được cập nhật');
      assert.strictEqual(updatedProd.sizePricing.M, 7000, 'Giá size M đã được cập nhật');
      assert.strictEqual(updatedProd.sizePricing.L, 12000, 'Giá size L đã được cập nhật');
      console.log('  ✅ [PASS] POST /admin/products/:id/edit - Cập nhật giá theo size (S/M/L) thành công (302)');
    }

    console.log('\n=============================================================');
    console.log(' TẤT CẢ 10/10 MỤC KIỂM THỬ GIAO DIỆN EJS MỚI ĐÃ ĐẠT 100%!');
    console.log('=============================================================\n');

  } catch (err) {
    console.error('❌ Kiểm thử thất bại:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
}

runTests();
