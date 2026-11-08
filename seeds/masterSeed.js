require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');

// 1. Danh sach 4 chi nhanh Da Nang
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

// 2. Danh muc thuc don
const categories = [
  { name: 'Cà phê đặc sản', code: 'coffee', description: 'Cà phê rang xay thủ công Đà Nẵng & Tây Nguyên', icon: 'coffee' },
  { name: 'Bánh tươi thủ công', code: 'bakery', description: 'Bánh nướng nóng hổi mỗi sáng chuẩn công thức Pháp', icon: 'cake' },
  { name: 'Trà thảo mộc', code: 'tea', description: 'Trà hoa sen Cố Đô và thảo mộc thanh mát giải nhiệt', icon: 'leaf' },
  { name: 'Đặc sản FreshBite', code: 'specialty', description: 'Thức uống signature độc quyền sáng tạo', icon: 'star' }
];

// 3. Danh sach nguoi dung mau (dung User.create() de hash password qua pre('save') hook)
const users = [
  { fullName: 'Quản Trị Viên FreshBite', email: 'admin@freshbite.vn', password: 'password123', phone: '0905123456', role: 'admin' },
  { fullName: 'Lê Tự Nhật Thạch', email: 'thachltn@freshbite.vn', password: 'password123', phone: '0905000555', role: 'admin' },
  { fullName: 'Nguyễn Chí Vương', email: 'vuongnc@fe.edu.vn', password: 'password123', phone: '0905111222', role: 'user' },
  { fullName: 'Nguyễn Đắc Thịnh', email: 'thinhnd@freshbite.vn', password: 'password123', phone: '0905333444', role: 'user' },
  { fullName: 'Khách Hàng Mẫu', email: 'user@freshbite.vn', password: 'password123', phone: '0912345678', role: 'user' }
];

// 4. Danh sach san pham phong phu da dang co sizePricing
const productsRaw = [
  {
    name: 'Cà phê Muối Đà Nẵng',
    categoryCode: 'coffee',
    price: 32000,
    sizePricing: { S: 29000, M: 32000, L: 37000 },
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
    sizePricing: { S: 38000, M: 42000, L: 48000 },
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
    sizePricing: { S: 40000, M: 45000, L: 52000 },
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
    sizePricing: { S: 34000, M: 38000, L: 44000 },
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
    sizePricing: { M: 35000 },
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
    sizePricing: { M: 45000 },
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
    sizePricing: { M: 28000 },
    calories: 110,
    description: 'Bánh nướng 2 lần giòn tan, ít ngọt, giàu protein và chất xơ, thích hợp ăn kiêng giữ dáng.',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
    ingredients: ['Yến mạch nguyên cám', 'Hạnh nhân', 'Nho khô', 'Mật ong'],
    isBestSeller: false,
    isAvailable: true
  },
  {
    name: 'Matcha Latte Đậu Đỏ Nhật Bản',
    categoryCode: 'specialty',
    price: 48000,
    sizePricing: { S: 42000, M: 48000, L: 55000 },
    calories: 220,
    description: 'Bột trà xanh Uji thượng hạng kết hợp sữa tươi thanh trùng và đậu đỏ ngọt dịu.',
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800',
    ingredients: ['Matcha Uji', 'Đậu đỏ Azuki', 'Sữa tươi'],
    isBestSeller: true,
    isAvailable: true
  }
];

const masterSeed = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CẢNH BÁO: Không chạy script seed trên môi trường Production!');
    }

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI không được định nghĩa trong file .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('=== BẮT ĐẦU MASTER SEED CHO FRESHBITE (LÊ TỰ NHẬT THẠCH - 20%) ===\n');

    // 1. Seed Branches
    console.log('[1/5] Đồng bộ 4 chi nhánh Đà Nẵng...');
    const branchNames = branches.map(b => b.name);
    await Branch.deleteMany({ name: { $in: branchNames } });
    const insertedBranches = await Branch.insertMany(branches);
    console.log(` -> Đã nạp thành công ${insertedBranches.length} chi nhánh.`);

    // 2. Seed Categories
    console.log('\n[2/5] Đồng bộ danh mục sản phẩm...');
    for (const cat of categories) {
      await Category.findOneAndUpdate({ code: cat.code }, cat, { upsert: true, new: true });
    }
    const allCategories = await Category.find();
    const catMap = {};
    allCategories.forEach(c => { catMap[c.code] = c._id; });
    console.log(` -> Đã nạp thành công ${allCategories.length} danh mục.`);

    // 3. Seed Products
    console.log('\n[3/5] Đồng bộ thực đơn món ăn và định giá theo size...');
    for (const p of productsRaw) {
      const categoryId = catMap[p.categoryCode];
      await Product.findOneAndUpdate(
        { name: p.name },
        { ...p, categoryId },
        { upsert: true, new: true }
      );
    }
    const allProducts = await Product.find();
    console.log(` -> Đã nạp thành công ${allProducts.length} món ăn.`);

    // 4. Seed Users (Dùng User.create() để kích hoạt hook bcrypt hash password)
    console.log('\n[4/5] Đồng bộ tài khoản người dùng và quản trị viên...');
    const userMap = {};
    for (const u of users) {
      let existingUser = await User.findOne({ email: u.email });
      if (!existingUser) {
        existingUser = await User.create(u);
        console.log(` -> Đã tạo tài khoản mới: [${u.role}] ${u.email}`);
      } else {
        console.log(` -> Đã tìm thấy tài khoản: [${existingUser.role}] ${existingUser.email}`);
      }
      userMap[u.email] = existingUser;
    }

    // 5. Seed Sample Orders cho quầy Barista KDS và Dashboard EJS SSR
    console.log('\n[5/5] Đồng bộ đơn hàng mẫu phục vụ màn hình KDS Barista...');
    const sampleCustomer = userMap['user@freshbite.vn'] || userMap['admin@freshbite.vn'];
    const branch1 = insertedBranches[0];
    const branch2 = insertedBranches[1];
    const prod1 = allProducts[0];
    const prod2 = allProducts[1];

    const sampleOrders = [
      {
        orderCode: 'FB-90001',
        userId: sampleCustomer._id,
        branchId: branch1._id,
        items: [
          { productId: prod1._id, name: prod1.name, price: prod1.price, quantity: 2, size: 'M' },
          { productId: prod2._id, name: prod2.name, price: prod2.price, quantity: 1, size: 'L' }
        ],
        subtotal: prod1.price * 2 + prod2.price,
        discountAmount: 0,
        totalAmount: prod1.price * 2 + prod2.price,
        paymentMethod: 'CASH_AT_COUNTER',
        paymentStatus: 'PENDING',
        status: 'Pending',
        pickupTime: new Date(Date.now() + 15 * 60 * 1000)
      },
      {
        orderCode: 'FB-90002',
        userId: sampleCustomer._id,
        branchId: branch1._id,
        items: [
          { productId: prod1._id, name: prod1.name, price: prod1.price, quantity: 1, size: 'S' }
        ],
        subtotal: prod1.price,
        discountAmount: 5000,
        totalAmount: prod1.price - 5000,
        paymentMethod: 'VNPAY',
        paymentStatus: 'PAID',
        status: 'Preparing',
        pickupTime: new Date(Date.now() + 20 * 60 * 1000)
      },
      {
        orderCode: 'FB-90003',
        userId: sampleCustomer._id,
        branchId: branch2._id,
        items: [
          { productId: prod2._id, name: prod2.name, price: prod2.price, quantity: 2, size: 'M' }
        ],
        subtotal: prod2.price * 2,
        discountAmount: 0,
        totalAmount: prod2.price * 2,
        paymentMethod: 'MOMO',
        paymentStatus: 'PAID',
        status: 'Ready for Pickup',
        pickupTime: new Date()
      },
      {
        orderCode: 'FB-90004',
        userId: sampleCustomer._id,
        branchId: branch2._id,
        items: [
          { productId: prod1._id, name: prod1.name, price: prod1.price, quantity: 3, size: 'L' }
        ],
        subtotal: prod1.price * 3,
        discountAmount: 10000,
        totalAmount: prod1.price * 3 - 10000,
        paymentMethod: 'CASH_AT_COUNTER',
        paymentStatus: 'PAID',
        status: 'Completed',
        pickupTime: new Date(Date.now() - 30 * 60 * 1000)
      }
    ];

    for (const ord of sampleOrders) {
      await Order.findOneAndUpdate({ orderCode: ord.orderCode }, ord, { upsert: true, new: true });
    }
    console.log(` -> Đã nạp thành công ${sampleOrders.length} đơn hàng mẫu đầy đủ trạng thái KDS.`);

    console.log('\n============================================================');
    console.log(' MASTER SEED HOÀN TẤT THÀNH CÔNG RỰC RỠ!');
    console.log(' - 4 Chi nhánh Đà Nẵng: Sẵn sàng');
    console.log(' - 4 Danh mục & Thực đơn: Đã cấu hình sizePricing');
    console.log(' - 5 Tài khoản mẫu: Mật khẩu mặc định "password123"');
    console.log(' - Màn hình KDS & Dashboard EJS: Đã có đơn hàng trực quan');
    console.log('============================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Lỗi trong quá trình Master Seed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  masterSeed();
}

module.exports = masterSeed;
