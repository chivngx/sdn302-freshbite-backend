/**
 * Script: Seed Kiểm Thử Nhanh (Fast Test Seed)
 * Tác giả: Lê Tự Nhật Thạch (Uploads, Seed Data & Web Admin SSR Lead)
 * Mục đích: Khởi tạo nhanh môi trường test cho đồng đội & chạy Postman Test Suite,
 *          bao gồm sản phẩm isAvailable = false để kiểm thử bắt lỗi 400 HTTP.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Branch = require('../models/Branch');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Voucher = require('../models/Voucher');
const Order = require('../models/Order');

const branches = [
  {
    name: 'FreshBite FPT City (Ngũ Hành Sơn)',
    address: 'Tòa F-Complex, Khu đô thị FPT City, P. Hòa Hải, Q. Ngũ Hành Sơn, Đà Nẵng',
    district: 'Ngũ Hành Sơn',
    latitude: 15.969234,
    longitude: 108.261221,
    phone: '0236.730.0999',
    openingHours: '06:30 - 22:00',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    isActive: true,
    outOfStockProductIds: []
  },
  {
    name: 'FreshBite Bạch Đằng (Hải Châu)',
    address: '154 Bạch Đằng, P. Hải Châu 1, Q. Hải Châu, Đà Nẵng',
    district: 'Hải Châu',
    latitude: 16.067822,
    longitude: 108.220815,
    phone: '0236.388.8222',
    openingHours: '06:30 - 23:00',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    isActive: true,
    outOfStockProductIds: []
  },
  {
    name: 'FreshBite Võ Văn Kiệt (Sơn Trà)',
    address: '68 Võ Văn Kiệt, P. An Hải Đông, Q. Sơn Trà, Đà Nẵng',
    district: 'Sơn Trà',
    latitude: 16.061044,
    longitude: 108.238055,
    phone: '0236.399.9111',
    openingHours: '06:30 - 22:30',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    isActive: true,
    outOfStockProductIds: []
  },
  {
    name: 'FreshBite Điện Biên Phủ (Thanh Khê)',
    address: '242 Điện Biên Phủ, P. Chính Gián, Q. Thanh Khê, Đà Nẵng',
    district: 'Thanh Khê',
    latitude: 16.062011,
    longitude: 108.185012,
    phone: '0236.377.7333',
    openingHours: '07:00 - 22:00',
    imageUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800',
    isActive: true,
    outOfStockProductIds: []
  }
];

const categories = [
  { name: 'Cà phê', code: 'coffee', description: 'Cà phê đặc sản Đà Nẵng', icon: 'coffee' },
  { name: 'Bánh thủ công', code: 'bakery', description: 'Bánh tươi nướng mỗi ngày', icon: 'cake' },
  { name: 'Trà', code: 'tea', description: 'Trà thanh lọc mát lành', icon: 'leaf' },
  { name: 'Đặc sản FreshBite', code: 'specialty', description: 'Thức uống signature', icon: 'star' }
];

// Dữ liệu 8+ sản phẩm đặc sản Đà Nẵng (gồm món cố tình tắt hàng để test lỗi 400)
const testProducts = [
  {
    name: 'Cà phê Muối Đà Nẵng',
    categoryCode: 'coffee',
    price: 32000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 180,
    isBestSeller: true,
    isAvailable: true,
    ingredients: ['Cà phê Robusta Đắk Lắk', 'Muối hồng', 'Sữa đặc'],
    description: 'Cà phê Muối béo ngậy đặc sản Đà Nẵng',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800'
  },
  {
    name: 'Cold Brew Cam Vàng Sơn Trà',
    categoryCode: 'coffee',
    price: 45000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 80,
    isBestSeller: true,
    isAvailable: true,
    ingredients: ['Cà phê Arabica Cầu Đất', 'Cam vàng Sơn Trà'],
    description: 'Cà phê ủ lạnh kết hợp cam vàng bán đảo Sơn Trà',
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800'
  },
  {
    name: 'Cà phê Dừa Non Xay',
    categoryCode: 'specialty',
    price: 42000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 260,
    isBestSeller: true,
    isAvailable: true,
    ingredients: ['Cốt dừa non', 'Espresso đậm đặc', 'Sữa'],
    description: 'Cốt dừa non béo ngậy xay đá tuyết mát lạnh',
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800'
  },
  {
    name: 'Trà Lài Hạt Sen Cố Đô',
    categoryCode: 'tea',
    price: 38000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 120,
    isBestSeller: false,
    isAvailable: true,
    ingredients: ['Trà hoa lài', 'Hạt sen Huế', 'Đường phèn'],
    description: 'Trà lài thanh mát hòa quyện hạt sen bùi ngậy',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800'
  },
  {
    name: 'Bánh Croissant Bơ Tỏi Trứng Muối',
    categoryCode: 'bakery',
    price: 35000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 310,
    isBestSeller: true,
    isAvailable: true,
    ingredients: ['Bột mì Pháp', 'Bơ lạt Elle & Vire', 'Trứng muối', 'Tỏi Lý Sơn'],
    description: 'Vỏ bánh ngàn lớp giòn rụm thơm nức bơ tỏi trứng muối',
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800'
  },
  {
    name: 'Bánh Tiramisu Vị Cà Phê Cốt Dừa',
    categoryCode: 'bakery',
    price: 45000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 280,
    isBestSeller: false,
    isAvailable: true,
    ingredients: ['Mascarpone Ý', 'Cà phê Robusta', 'Cốt dừa'],
    description: 'Tiramisu phong vị biển nhiệt đới thơm béo',
    imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800'
  },
  {
    name: 'Bánh Biscotti Yến Mạch Hạnh Nhân',
    categoryCode: 'bakery',
    price: 28000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 110,
    isBestSeller: false,
    isAvailable: true,
    ingredients: ['Yến mạch', 'Hạnh nhân Úc', 'Nho khô'],
    description: 'Bánh ăn kiêng giữ dáng giòn thơm ít ngọt',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800'
  },
  // MÓN ĐẶC BIỆT: isAvailable = false để test kịch bản bắt lỗi 400 Bad Request
  {
    name: 'Bánh Mì Que Pate (Hết hàng test)',
    categoryCode: 'bakery',
    price: 20000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 200,
    isBestSeller: false,
    isAvailable: false, // <-- Cố tình false để test lỗi 400
    ingredients: ['Bột mì', 'Pate gan heo tiêu sọ'],
    description: 'Món bánh mì que dùng riêng để kiểm thử bắt lỗi 400 sản phẩm hết hàng',
    imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800'
  }
];

const vouchers = [
  {
    code: 'FRESHBITE10',
    title: 'Giảm 10% Chào Bạn Mới',
    discountType: 'PERCENT',
    discountValue: 10,
    maxDiscount: 30000,
    minOrderAmount: 50000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31T23:59:59'),
    isActive: true
  },
  {
    code: 'FPTCITY20',
    title: 'Ưu đãi Sinh viên FPT City & VKU',
    discountType: 'PERCENT',
    discountValue: 20,
    maxDiscount: 40000,
    minOrderAmount: 60000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31T23:59:59'),
    isActive: true
  },
  {
    code: 'BANHNGOT15K',
    title: 'Giảm 15K Khi Mua Kèm Bánh Bất Kỳ',
    discountType: 'FIXED',
    discountValue: 15000,
    maxDiscount: 15000,
    minOrderAmount: 40000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31T23:59:59'),
    isActive: true
  }
];

const runTestSeed = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Không được chạy testSeed trên production!');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- KHỞI CHẠY TEST SEED NHANH CHO FRESHBITE ---');

    await Promise.all([
      Branch.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Voucher.deleteMany({})
    ]);

    // 1. Nạp chi nhánh
    const createdBranches = await Branch.insertMany(branches);

    // 2. Nạp danh mục
    const createdCats = await Category.insertMany(categories);
    const catMap = Object.fromEntries(createdCats.map((c) => [c.code, c._id]));

    // 3. Nạp sản phẩm (kèm món hết hàng)
    const productDocs = testProducts.map((p) => ({
      ...p,
      categoryId: catMap[p.categoryCode]
    }));
    const createdProducts = await Product.insertMany(productDocs);

    // 4. Nạp vouchers
    await Voucher.insertMany(vouchers);

    // 5. Gán 1 món vào outOfStockProductIds của chi nhánh 1 để test kiểm soát tồn kho chi nhánh
    const saltCoffee = createdProducts.find((p) => p.name === 'Cà phê Muối Đà Nẵng');
    if (saltCoffee && createdBranches[0]) {
      // Chi nhánh Bạch Đằng tạm hết Cà phê muối để phục vụ test nhánh khác
      createdBranches[1].outOfStockProductIds = [saltCoffee._id];
      await createdBranches[1].save();
    }

    console.log(`[TEST SEED XONG]`);
    console.log(`- Đã nạp ${createdBranches.length} chi nhánh`);
    console.log(`- Đã nạp ${createdCats.length} danh mục`);
    console.log(`- Đã nạp ${createdProducts.length} sản phẩm (gồm 1 món isAvailable=false test lỗi 400)`);
    console.log(`- Đã nạp ${vouchers.length} vouchers khuyến mãi`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi chạy testSeed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  runTestSeed();
}

module.exports = { runTestSeed };
