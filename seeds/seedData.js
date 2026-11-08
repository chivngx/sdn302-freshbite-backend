/**
 * Script: Seed Data Đầy Đủ Hệ Thống FreshBite Đà Nẵng
 * Tác giả: Lê Tự Nhật Thạch (Uploads, Seed Data & Web Admin SSR Lead)
 * Mô tả: Nạp 4 chi nhánh Đà Nẵng (kèm GPS), 4 danh mục, 20 món ăn đặc sản,
 *        3 mã voucher khuyến mãi và danh sách tài khoản test (sử dụng User.create).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Branch = require('../models/Branch');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Voucher = require('../models/Voucher');
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
    isActive: true,
    outOfStockProductIds: []
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
    isActive: true,
    outOfStockProductIds: []
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
  { name: 'Cà phê', code: 'coffee', description: 'Cà phê đặc sản rang xay nguyên chất Đà Nẵng', icon: 'coffee' },
  { name: 'Bánh thủ công', code: 'bakery', description: 'Bánh ngọt & bánh mì tươi nướng thủ công mỗi ngày', icon: 'cake' },
  { name: 'Trà thảo mộc', code: 'tea', description: 'Trà thanh lọc mát lành kết hợp hoa quả nhiệt đới', icon: 'leaf' },
  { name: 'Đặc sản FreshBite', code: 'specialty', description: 'Thức uống signature độc quyền phong vị miền Trung', icon: 'star' }
];

const productsData = [
  // Nhóm 1: Cà phê (coffee)
  {
    name: 'Cà phê Muối Đà Nẵng',
    categoryCode: 'coffee',
    price: 32000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 180,
    description: 'Cà phê Robusta Đắk Lắk đậm đà hòa quyện cùng lớp kem muối hồng béo ngậy chuẩn vị Đà Nẵng.',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800',
    ingredients: ['Cà phê Robusta Đắk Lắk', 'Muối hồng Himalaya', 'Sữa đặc', 'Kem béo whipping'],
    isBestSeller: true,
    isAvailable: true
  },
  {
    name: 'Cold Brew Cam Vàng Sơn Trà',
    categoryCode: 'coffee',
    price: 45000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 80,
    description: 'Cà phê ủ lạnh 16 tiếng chiết xuất hương hoa quả tự nhiên, kết hợp cam vàng Sơn Trà mọng nước.',
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800',
    ingredients: ['Cà phê Arabica Cầu Đất', 'Cam vàng Sơn Trà', 'Nước khoáng tự nhiên'],
    isBestSeller: true,
    isAvailable: true
  },
  {
    name: 'Cà Phê Phin Sữa Đá Đà Nẵng',
    categoryCode: 'coffee',
    price: 28000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 150,
    description: 'Hương vị cà phê phin truyền thống thơm nồng đượm, hòa cùng sữa đặc Ngôi Sao Phương Nam ngọt ngào.',
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800',
    ingredients: ['Cà phê Robusta phin', 'Sữa đặc', 'Đá viên tinh khiết'],
    isBestSeller: false,
    isAvailable: true
  },
  {
    name: 'Espresso Sữa Hạnh Nhân Đá',
    categoryCode: 'coffee',
    price: 42000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 95,
    description: 'Gấp đôi shot espresso đậm vị phối hợp cùng sữa hạt hạnh nhân nguyên chất, thích hợp cho người ăn kiêng.',
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800',
    ingredients: ['Espresso 100% Arabica', 'Sữa hạnh nhân Blue Diamond', 'Siro vani'],
    isBestSeller: false,
    isAvailable: true
  },
  {
    name: 'Cà Phê Bạc Xỉu Kem Trứng',
    categoryCode: 'coffee',
    price: 36000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 220,
    description: 'Bạc xỉu ba tầng đẹp mắt phủ lớp kem trứng đánh bông mịn sánh vàng, thơm lừng béo ngậy.',
    imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800',
    ingredients: ['Sữa tươi Dalat Milk', 'Sữa đặc', 'Lòng đỏ trứng gà ta', 'Cà phê phin'],
    isBestSeller: true,
    isAvailable: true
  },

  // Nhóm 2: Bánh thủ công (bakery)
  {
    name: 'Bánh Croissant Bơ Tỏi Trứng Muối',
    categoryCode: 'bakery',
    price: 35000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 310,
    description: 'Vỏ bánh ngàn lớp giòn rụm thơm nức sốt bơ tỏi Lý Sơn và nhân trứng muối bùi béo tan chảy.',
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800',
    ingredients: ['Bột mì Pháp T55', 'Bơ lạt Elle & Vire', 'Trứng muối tươi', 'Tỏi tép Lý Sơn'],
    isBestSeller: true,
    isAvailable: true
  },
  {
    name: 'Bánh Tiramisu Vị Cà Phê Cốt Dừa',
    categoryCode: 'bakery',
    price: 45000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 280,
    description: 'Biến tấu Tiramisu Ý với cốt dừa Bến Tre và cà phê Robusta Đắk Lắk đậm đà hòa quyện phô mai Mascarpone.',
    imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
    ingredients: ['Phô mai Mascarpone Ý', 'Bánh sâm-panh Savoiardi', 'Cà phê Robusta', 'Cốt dừa non'],
    isBestSeller: false,
    isAvailable: true
  },
  {
    name: 'Bánh Biscotti Yến Mạch Hạnh Nhân',
    categoryCode: 'bakery',
    price: 28000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 110,
    description: 'Bánh nướng hai lần giòn tan, ít ngọt, giàu protein và chất xơ, thích hợp ăn kiêng và tập gym.',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
    ingredients: ['Yến mạch nguyên cám Úc', 'Hạt hạnh nhân', 'Nho khô Chile', 'Mật ong hoa rừng'],
    isBestSeller: false,
    isAvailable: true
  },
  {
    name: 'Bánh Mì Que Pate Đà Nẵng',
    categoryCode: 'bakery',
    price: 22000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 210,
    description: 'Bánh mì que nướng giòn rụm kẹp pate gan heo tiêu sọ béo thơm cùng chút ớt rim cay nồng chuẩn vị xứ Quảng.',
    imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800',
    ingredients: ['Bột mì nướng giòn', 'Pate gan heo truyền thống', 'Ớt rim cay ngọt', 'Tiêu sọ'],
    isBestSeller: true,
    isAvailable: true
  },
  {
    name: 'Bánh Danish Dâu Tây Đà Lạt',
    categoryCode: 'bakery',
    price: 38000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 260,
    description: 'Vỏ bánh ngàn lớp giòn tan bao bọc lớp kem custard béo mịn cùng những lát dâu tây tươi mọng nước từ Đà Lạt.',
    imageUrl: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=800',
    ingredients: ['Bột pastry', 'Kem custard sữa tươi', 'Dâu tây tươi Đà Lạt', 'Mứt dâu'],
    isBestSeller: false,
    isAvailable: true
  },
  {
    name: 'Bánh Su Kem Hoàng Gia Vanilla',
    categoryCode: 'bakery',
    price: 26000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 170,
    description: 'Vỏ bánh giòn xốp bên ngoài, bên trong tràn ngập kem tươi vani Madagascar mát lạnh ngọt dịu.',
    imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800',
    ingredients: ['Vỏ choux pastry', 'Vani hạt Madagascar', 'Kem tươi Anchor', 'Đường bột'],
    isBestSeller: false,
    isAvailable: true
  },

  // Nhóm 3: Trà thảo mộc (tea)
  {
    name: 'Trà Lài Hạt Sen Cố Đô',
    categoryCode: 'tea',
    price: 38000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 120,
    description: 'Trà hoa lài Bảo Lộc thanh tao ủ lạnh, kết hợp hạt sen tươi ninh mềm bùi ngọt nấu cùng đường phèn.',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800',
    ingredients: ['Trà hoa lài Bảo Lộc', 'Hạt sen Huế tươi', 'Đường phèn Quảng Ngãi', 'Lá dứa thơm'],
    isBestSeller: false,
    isAvailable: true
  },
  {
    name: 'Trà Đào Cam Sả Sơn Trà',
    categoryCode: 'tea',
    price: 39000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 110,
    description: 'Hương trà đen đậm đà quyện cùng vị ngọt giòn của đào miếng và tinh dầu sả cam sảng khoái ngày nắng biển.',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800',
    ingredients: ['Trà đen Ceylon', 'Đào ngâm giòn', 'Cam vàng tươi', 'Sả cây đập dập'],
    isBestSeller: true,
    isAvailable: true
  },
  {
    name: 'Trà Oolong Vải Băng Tuyết',
    categoryCode: 'tea',
    price: 42000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 130,
    description: 'Trà Oolong thượng hạng thanh hương kết hợp trái vải mọng nước và đá tuyết mát lạnh sảng khoái.',
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800',
    ingredients: ['Trà Oolong Tứ Quý', 'Trái vải thiều mọng nước', 'Thạch nha đam giòn'],
    isBestSeller: false,
    isAvailable: true
  },
  {
    name: 'Trà Xanh Sữa Hạt Sen Tươi',
    categoryCode: 'tea',
    price: 39000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 165,
    description: 'Lá trà xanh Thái Nguyên tiền chát hậu ngọt hòa quyện cùng sữa tươi thanh trùng và hạt sen ninh nhuyễn.',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800',
    ingredients: ['Trà xanh Thái Nguyên', 'Sữa tươi thanh trùng', 'Hạt sen tươi bùi béo'],
    isBestSeller: false,
    isAvailable: true
  },

  // Nhóm 4: Đặc sản FreshBite (specialty)
  {
    name: 'Cà phê Dừa Non Xay',
    categoryCode: 'specialty',
    price: 42000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 260,
    description: 'Cốt dừa non Bến Tre béo ngậy xay tuyết mịn màng, rót kèm shot espresso thơm nồng - Món giải nhiệt số 1 mùa hè.',
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800',
    ingredients: ['Cùi dừa non Bến Tre', 'Shot Espresso đậm đặc', 'Sữa đặc', 'Tuyết đá xay'],
    isBestSeller: true,
    isAvailable: true
  },
  {
    name: 'Cà Phê Trứng Béo Ngậy Phố Cổ',
    categoryCode: 'specialty',
    price: 46000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 275,
    description: 'Lớp kem trứng tươi đánh bông mịn như mây kết hợp cà phê phin nóng hổi, ngọt ngào không hề tanh.',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
    ingredients: ['Lòng đỏ trứng gà ta', 'Cà phê Robusta phin nóng', 'Mật ong rừng', 'Rượu rum'],
    isBestSeller: false,
    isAvailable: true
  },
  {
    name: 'Matcha Dừa Non Băng Tuyết',
    categoryCode: 'specialty',
    price: 45000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 230,
    description: 'Bột matcha Uji Kyoto Nhật Bản đậm vị trà kết hợp cốt dừa non xay mịn béo mát tuyệt hảo.',
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800',
    ingredients: ['Matcha Uji Nhật Bản', 'Nước cốt dừa non', 'Sữa tươi', 'Đá xay tuyết'],
    isBestSeller: false,
    isAvailable: true
  },
  {
    name: 'Sinh Tố Bơ Cốt Dừa Sơn Trà',
    categoryCode: 'specialty',
    price: 48000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 320,
    description: 'Bơ sáp Đắk Lắk dẻo quánh xay cùng nước cốt dừa tươi thơm béo và dừa sợi sấy giòn rụm.',
    imageUrl: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=800',
    ingredients: ['Bơ sáp Đắk Lắk loại 1', 'Nước cốt dừa tươi', 'Dừa sấy giòn', 'Sữa đặc'],
    isBestSeller: true,
    isAvailable: true
  },
  {
    name: 'Cacao Sữa Quế Nóng Miền Trung',
    categoryCode: 'specialty',
    price: 38000,
    sizePricing: { S: 0, M: 6000, L: 10000 },
    calories: 210,
    description: 'Bột cacao Bến Tre nguyên chất nấu cùng sữa tươi thơm lừng, rắc thêm chút bột quế Trà Bồng ấm áp.',
    imageUrl: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800',
    ingredients: ['Bột cacao nguyên chất', 'Sữa tươi nóng', 'Bột quế Trà Bồng', 'Marshmallow'],
    isBestSeller: false,
    isAvailable: true
  }
];

const vouchersData = [
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

const usersData = [
  {
    fullName: 'Admin FreshBite',
    email: 'admin@freshbite.com',
    password: 'password123',
    phone: '0987654321',
    role: 'admin'
  },
  {
    fullName: 'Nguyen Van Test',
    email: 'user@freshbite.com',
    password: 'password123',
    phone: '0912345678',
    role: 'user'
  },
  {
    fullName: 'Lê Tự Nhật Thạch',
    email: 'thachltn@fe.edu.vn',
    password: 'password123',
    phone: '0905123789',
    role: 'admin'
  },
  {
    fullName: 'Lê Đức Sơn',
    email: 'sonld@fe.edu.vn',
    password: 'password123',
    phone: '0905111222',
    role: 'user'
  },
  {
    fullName: 'Nguyễn Chí Vương',
    email: 'vuongnc@fe.edu.vn',
    password: 'password123',
    phone: '0905123456',
    role: 'user'
  }
];

const seedDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cảnh báo an toàn: Không được chạy script seed trên môi trường production!');
    }

    if (!process.env.MONGO_URI) {
      throw new Error('Thiếu biến MONGO_URI trong tệp cấu hình .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('================================================================');
    console.log('  FRESHBITE ĐÀ NẴNG - BẮT ĐẦU NẠP DỮ LIỆU SEED DATA ĐẦY ĐỦ');
    console.log('  Tác giả: Lê Tự Nhật Thạch (Uploads, Seeds & Web Admin SSR)');
    console.log('================================================================');

    // 1. Nạp Chi nhánh Đà Nẵng
    console.log('\n[1/5] Đang nạp danh sách 4 Chi nhánh Đà Nẵng...');
    await Branch.deleteMany({});
    const insertedBranches = await Branch.insertMany(branches);
    console.log(`[THÀNH CÔNG] Đã nạp ${insertedBranches.length} chi nhánh Đà Nẵng:`);
    insertedBranches.forEach((b, i) => {
      console.log(`  ${i + 1}. [${b.district}] ${b.name} (${b.latitude}, ${b.longitude})`);
    });

    // 2. Nạp Danh mục món ăn
    console.log('\n[2/5] Đang nạp danh mục thực đơn...');
    for (const cat of categories) {
      await Category.findOneAndUpdate({ code: cat.code }, cat, { upsert: true, new: true });
    }
    const allCategories = await Category.find();
    console.log(`[THÀNH CÔNG] Đã nạp ${allCategories.length} nhóm danh mục.`);
    const catMap = {};
    allCategories.forEach((c) => {
      catMap[c.code] = c._id;
    });

    // 3. Nạp 20 Món ăn mẫu Đà Nẵng
    console.log('\n[3/5] Đang nạp danh sách 20 món ăn mẫu Đà Nẵng...');
    await Product.deleteMany({});
    const productDocs = productsData.map((p) => ({
      ...p,
      categoryId: catMap[p.categoryCode]
    }));
    const insertedProducts = await Product.insertMany(productDocs);
    console.log(`[THÀNH CÔNG] Đã nạp ${insertedProducts.length} món ăn đặc sản Đà Nẵng.`);

    // 4. Nạp Mã giảm giá (Vouchers)
    console.log('\n[4/5] Đang nạp các mã giảm giá Vouchers...');
    await Voucher.deleteMany({});
    const insertedVouchers = await Voucher.insertMany(vouchersData);
    console.log(`[THÀNH CÔNG] Đã nạp ${insertedVouchers.length} mã voucher khuyến mãi:`);
    insertedVouchers.forEach((v) => {
      console.log(`  - [${v.code}] ${v.title} (${v.discountType === 'PERCENT' ? v.discountValue + '%' : v.discountValue + 'đ'})`);
    });

    // 5. Nạp Người dùng kiểm thử bằng User.create() để chạy Bcrypt pre-save hook
    console.log('\n[5/5] Đang nạp các tài khoản người dùng kiểm thử...');
    await User.deleteMany({ email: { $in: usersData.map((u) => u.email) } });
    for (const u of usersData) {
      // BẮT BUỘC dùng User.create(u) thay vì insertMany() để kích hoạt hook pre('save') băm mật khẩu
      const createdUser = await User.create(u);
      console.log(`  - [${createdUser.role.toUpperCase()}] ${createdUser.email} (Mật khẩu: 123456)`);
    }

    console.log('\n================================================================');
    console.log('  TẤT CẢ DỮ LIỆU ĐÃ ĐƯỢC SEED THÀNH CÔNG VÀO CSDL MONGODB!');
    console.log('================================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi thực hiện seed dữ liệu:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, branches, categories, productsData, vouchersData, usersData };
