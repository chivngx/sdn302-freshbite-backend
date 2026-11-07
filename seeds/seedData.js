require('dotenv').config();
const mongoose = require('mongoose');
const Branch = require('../models/Branch');
const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');

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
    isActive: true
  },
  {
    name: 'FreshBite Bạch Đằng (Hải Châu)',
    address: '154 Bạch Đằng, P. Hải Châu 1, Q. Hải Châu, Đà Nẵng (Ven sông Hàn)',
    district: 'Hải Châu',
    latitude: 16.067822,
    longitude: 108.220815,
    phone: '0236.388.8222',
    openingHours: '06:30 - 23:00',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    isActive: true
  },
  {
    name: 'FreshBite Võ Văn Kiệt (Sơn Trà)',
    address: '68 Võ Văn Kiệt, P. An Hải Đông, Q. Sơn Trà, Đà Nẵng (Đường ra biển Mỹ Khê)',
    district: 'Sơn Trà',
    latitude: 16.061044,
    longitude: 108.238055,
    phone: '0236.399.9111',
    openingHours: '06:30 - 22:30',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    isActive: true
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
    isActive: true
  }
];

const categories = [
  { name: 'Cà phê', code: 'coffee', description: 'Cà phê đặc sản Đà Nẵng', icon: 'coffee' },
  { name: 'Bánh thủ công', code: 'bakery', description: 'Bánh tươi nướng mỗi ngày', icon: 'cake' },
  { name: 'Trà thảo mộc', code: 'tea', description: 'Trà thanh lọc mát lành', icon: 'leaf' },
  { name: 'Đặc sản FreshBite', code: 'specialty', description: 'Thức uống signature Đà Nẵng', icon: 'star' }
];

const productsData = [
  {
    name: 'Cà phê Muối Đà Nẵng',
    categoryCode: 'coffee',
    price: 32000,
    calories: 180,
    description: 'Cà phê Robusta Đắk Lắk đậm đà hòa quyện cùng lớp kem muối hồng béo ngậy chuẩn vị Đà Nẵng.',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800',
    ingredients: ['Cà phê Robusta Đắk Lắk', 'Muối hồng', 'Sữa đặc', 'Kem béo'],
    isBestSeller: true,
    isAvailable: true
  },
  {
    name: 'Cà phê Dừa Non Xay',
    categoryCode: 'specialty',
    price: 42000,
    calories: 260,
    description: 'Cốt dừa non béo ngậy xay mịn kết hợp cùng espresso thơm lừng, món giải nhiệt số 1 mùa hè.',
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800',
    ingredients: ['Cốt dừa non', 'Espresso', 'Sữa tươi', 'Đá xay'],
    isBestSeller: true,
    isAvailable: true
  },
  {
    name: 'Cold Brew Cam Vàng Sơn Trà',
    categoryCode: 'coffee',
    price: 45000,
    calories: 80,
    description: 'Cà phê ủ lạnh 16 tiếng chiết xuất hương hoa quả, kết hợp cam vàng mọng nước vùng bán đảo Sơn Trà.',
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800',
    ingredients: ['Cà phê Arabica Cầu Đất', 'Cam vàng Sơn Trà', 'Nước khoáng'],
    isBestSeller: true,
    isAvailable: true
  },
  {
    name: 'Trà Lài Hạt Sen Cố Đô',
    categoryCode: 'tea',
    price: 38000,
    calories: 120,
    description: 'Trà hoa lài thanh tao kết hợp hạt sen bùi béo nấu đường phèn thanh mát.',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800',
    ingredients: ['Trà hoa lài', 'Hạt sen Huế', 'Đường phèn'],
    isBestSeller: false,
    isAvailable: true
  },
  {
    name: 'Bánh Croissant Bơ Tỏi Trứng Muối',
    categoryCode: 'bakery',
    price: 35000,
    calories: 310,
    description: 'Vỏ bánh ngàn lớp giòn rụm thơm lừng sốt bơ tỏi và nhân trứng muối béo ngậy.',
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800',
    ingredients: ['Bột mì Pháp', 'Bơ Anchor', 'Trứng muối', 'Tỏi Lý Sơn'],
    isBestSeller: true,
    isAvailable: true
  },
  {
    name: 'Bánh Tiramisu Vị Cà Phê Cốt Dừa',
    categoryCode: 'bakery',
    price: 45000,
    calories: 280,
    description: 'Biến tấu Tiramisu Ý với cốt dừa bản địa và cà phê phin đậm đà thơm ngậy.',
    imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
    ingredients: ['Phô mai Mascarpone', 'Bánh sâm-panh', 'Cà phê', 'Cốt dừa'],
    isBestSeller: false,
    isAvailable: true
  },
  {
    name: 'Bánh Biscotti Ăn Kiêng Yến Mạch Hạnh Nhân',
    categoryCode: 'bakery',
    price: 28000,
    calories: 110,
    description: 'Bánh nướng 2 lần giòn tan, ít ngọt, giàu protein và chất xơ, thích hợp ăn kiêng giữ dáng.',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
    ingredients: ['Yến mạch nguyên cám', 'Hạnh nhân', 'Nho khô', 'Mật ong'],
    isBestSeller: false,
    isAvailable: true
  }
];

const defaultUsers = [
  {
    fullName: 'FreshBite Administrator',
    email: 'admin@freshbite.vn',
    password: 'password123',
    phone: '0905123456',
    role: 'admin'
  },
  {
    fullName: 'Nguyen Dac Thinh (Customer)',
    email: 'thinhnd@freshbite.vn',
    password: 'password123',
    phone: '0905987654',
    role: 'user'
  }
];

const seedDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Không chạy script seed trên production!');
    }

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI không được định nghĩa trong file .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- BẮT ĐẦU NẠP DỮ LIỆU SEED CHO FRESHBITE ĐÀ NẴNG ---');

    // 1. Nạp chi nhánh
    await Branch.deleteMany({ name: { $in: branches.map(b => b.name) } });
    const insertedBranches = await Branch.insertMany(branches);
    console.log(`[OK] Đã nạp ${insertedBranches.length} chi nhánh Đà Nẵng:`);
    insertedBranches.forEach((b, idx) => {
      console.log(`  ${idx + 1}. [${b.district}] ${b.name} (${b.latitude}, ${b.longitude})`);
    });

    // 2. Nạp danh mục
    for (const cat of categories) {
      await Category.findOneAndUpdate({ code: cat.code }, cat, { upsert: true, new: true });
    }
    const allCategories = await Category.find();
    console.log(`[OK] Đã nạp/cập nhật ${allCategories.length} danh mục.`);
    const catMap = {};
    allCategories.forEach(c => { catMap[c.code] = c._id; });

    // 3. Nạp sản phẩm
    for (const prod of productsData) {
      const categoryId = catMap[prod.categoryCode];
      await Product.findOneAndUpdate(
        { name: prod.name },
        { ...prod, categoryId },
        { upsert: true, new: true }
      );
    }
    const allProducts = await Product.find();
    console.log(`[OK] Đã nạp/cập nhật ${allProducts.length} sản phẩm thực đơn.`);

    // 4. Nạp người dùng mặc định (nếu chưa có)
    for (const u of defaultUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
        console.log(`[OK] Đã tạo user mẫu: [${u.role}] ${u.email} (pass: 123456)`);
      }
    }

    console.log('--- NẠP DỮ LIỆU SEED HOÀN TẤT THÀNH CÔNG! ---');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi nạp dữ liệu:', error.message);
    process.exit(1);
  }
};

seedDatabase();

