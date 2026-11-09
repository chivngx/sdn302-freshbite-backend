/**
 * Script: Seed Dữ Liệu Lớn & Chân Thực (Rich Big Data Seeder)
 * Mục đích: Tạo lượng dữ liệu phong phú, sống động cho toàn bộ hệ thống FreshBite Đà Nẵng:
 * - 4 Chi nhánh Đà Nẵng kèm GPS
 * - 4 Nhóm danh mục & 20+ Món ăn đặc sản (Full size S/M/L)
 * - 10+ Tài khoản người dùng (Admin, Barista các ca, Khách hàng thân thiết)
 * - 8 Mã Voucher khuyến mãi đa dạng (% và tiền mặt, đang bật, hết hạn, tạm khóa)
 * - 35+ Đơn hàng với đầy đủ trạng thái KDS (Received, Preparing, Ready, Completed, Cancelled)
 * - 25+ Đánh giá sao & nhận xét chân thực (5 sao, 4 sao, 3 sao, bài ẩn kiểm duyệt)
 * - 35+ Tin nhắn Live Chat 2 chiều thời gian thực giữa Khách và Quầy Barista
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Message = require('../models/Message');
const Voucher = require('../models/Voucher');

const { branches, categories, productsData } = require('./seedData');

// 1. Danh sách người dùng mở rộng
const richUsers = [
  { fullName: 'Quản Trị Viên Trưởng', email: 'admin@freshbite.com', password: 'password123', phone: '0905123456', role: 'admin' },
  { fullName: 'Lê Tự Nhật Thạch', email: 'thachltn@freshbite.vn', password: 'password123', phone: '0905000555', role: 'admin' },
  { fullName: 'Barista FPT City', email: 'barista.fpt@freshbite.vn', password: 'password123', phone: '0905111222', role: 'admin' },
  { fullName: 'Barista Bạch Đằng', email: 'barista.bachdang@freshbite.vn', password: 'password123', phone: '0905222333', role: 'admin' },
  { fullName: 'Barista Sơn Trà', email: 'barista.sontra@freshbite.vn', password: 'password123', phone: '0905333444', role: 'admin' },
  { fullName: 'Nguyễn Văn An', email: 'user@freshbite.vn', password: 'password123', phone: '0912345678', role: 'user' },
  { fullName: 'Nguyễn Chí Vương', email: 'vuongnc@fe.edu.vn', password: 'password123', phone: '0905888999', role: 'user' },
  { fullName: 'Nguyễn Đắc Thịnh', email: 'thinhnd@freshbite.vn', password: 'password123', phone: '0905777888', role: 'user' },
  { fullName: 'Lê Đức Sơn', email: 'sonld@fe.edu.vn', password: 'password123', phone: '0905666777', role: 'user' },
  { fullName: 'Trần Thị Mỹ Linh', email: 'linh.danang@gmail.com', password: 'password123', phone: '0935123888', role: 'user' },
  { fullName: 'Lê Hoàng Nam (Dev FPT)', email: 'hoang.dev@fpt.edu.vn', password: 'password123', phone: '0944555666', role: 'user' },
  { fullName: 'Đặng Ngọc Mai', email: 'mai.coffee@gmail.com', password: 'password123', phone: '0978999111', role: 'user' },
  { fullName: 'Võ Quốc Tuấn', email: 'tuan.travel@gmail.com', password: 'password123', phone: '0988222333', role: 'user' },
  { fullName: 'Nguyễn Bích Phương', email: 'phuong.designer@gmail.com', password: 'password123', phone: '0919333444', role: 'user' }
];

// 2. Danh sách Voucher đa dạng
const richVouchers = [
  {
    code: 'FRESHBITE20',
    title: 'Giảm 20% Cho Đơn Hàng Từ 60K',
    discountType: 'PERCENT',
    discountValue: 20,
    maxDiscount: 50000,
    minOrderAmount: 60000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2027-12-31'),
    isActive: true
  },
  {
    code: 'CHAOBANMOI',
    title: 'Tặng 30.000đ Cho Khách Hàng Mới',
    discountType: 'FIXED',
    discountValue: 30000,
    maxDiscount: 30000,
    minOrderAmount: 50000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2027-12-31'),
    isActive: true
  },
  {
    code: 'FPTCITY15',
    title: 'Ưu Đãi 15% Dành Cho Cán Bộ & Sinh Viên FPT',
    discountType: 'PERCENT',
    discountValue: 15,
    maxDiscount: 30000,
    minOrderAmount: 40000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2027-12-31'),
    isActive: true
  },
  {
    code: 'HELLOSUMMER',
    title: 'Giải Nhiệt Mùa Hè - Giảm 25% Trà Hoa Quả',
    discountType: 'PERCENT',
    discountValue: 25,
    maxDiscount: 40000,
    minOrderAmount: 80000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2027-12-31'),
    isActive: true
  },
  {
    code: 'BANHTUOI10',
    title: 'Giảm 10.000đ Combo Bánh & Cà Phê Sáng',
    discountType: 'FIXED',
    discountValue: 10000,
    maxDiscount: 10000,
    minOrderAmount: 45000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2027-12-31'),
    isActive: true
  },
  {
    code: 'VIPFRESHBITE',
    title: 'Chiết Khấu VIP 35.000đ Đơn Hàng Lớn',
    discountType: 'FIXED',
    discountValue: 35000,
    maxDiscount: 35000,
    minOrderAmount: 120000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2027-12-31'),
    isActive: true
  },
  {
    code: 'FLASHDEAL50',
    title: 'Flash Sale 50% Khung Giờ Vàng (Tạm Khóa)',
    discountType: 'PERCENT',
    discountValue: 50,
    maxDiscount: 30000,
    minOrderAmount: 50000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2027-12-31'),
    isActive: false
  },
  {
    code: 'EXPIRED2025',
    title: 'Chương Trình Đón Năm Mới 2025 (Đã Hết Hạn)',
    discountType: 'FIXED',
    discountValue: 20000,
    maxDiscount: 20000,
    minOrderAmount: 50000,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    isActive: true
  }
];

async function seedRichData() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI không được tìm thấy trong file .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('================================================================');
    console.log('  BẮT ĐẦU NẠP DỮ LIỆU LỚN & ĐA DẠNG CHO FRESHBITE COFFEE');
    console.log('================================================================\n');

    // 1. Đồng bộ Chi Nhánh
    console.log('[1/7] Nạp 4 Chi Nhánh Đà Nẵng...');
    for (const b of branches) {
      await Branch.findOneAndUpdate({ name: b.name }, b, { upsert: true, new: true });
    }
    const branchDocs = await Branch.find({ isActive: true });
    console.log(`  -> Đã sẵn sàng ${branchDocs.length} chi nhánh.`);

    // 2. Đồng bộ Danh Mục
    console.log('\n[2/7] Nạp 4 Danh Mục Món Ăn...');
    for (const cat of categories) {
      await Category.findOneAndUpdate({ code: cat.code }, cat, { upsert: true, new: true });
    }
    const catDocs = await Category.find();
    const catMap = {};
    catDocs.forEach((c) => { catMap[c.code] = c._id; });
    console.log(`  -> Đã sẵn sàng ${catDocs.length} danh mục.`);

    // 3. Đồng bộ 20 Món Ăn Đặc Sản
    console.log('\n[3/7] Nạp 20 Món Ăn Đồ Uống & Định Giá Size S/M/L...');
    for (const p of productsData) {
      const categoryId = catMap[p.categoryCode] || catDocs[0]._id;
      await Product.findOneAndUpdate(
        { name: p.name },
        {
          name: p.name,
          categoryId,
          price: p.price,
          sizePricing: p.sizePricing || { S: 0, M: 6000, L: 10000 },
          calories: p.calories || 150,
          description: p.description,
          imageUrl: p.imageUrl,
          ingredients: p.ingredients,
          isBestSeller: Boolean(p.isBestSeller),
          isAvailable: p.isAvailable !== undefined ? p.isAvailable : true
        },
        { upsert: true, new: true }
      );
    }
    const productDocs = await Product.find();
    console.log(`  -> Đã nạp thành công ${productDocs.length} món ăn vào thực đơn.`);

    // 4. Đồng bộ Danh Sách Người Dùng
    console.log('\n[4/7] Nạp Danh Sách Người Dùng (Admin, Staff, Customer)...');
    const userMap = {};
    for (const u of richUsers) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create(u);
      }
      userMap[u.email] = user;
    }
    const allUsers = await User.find();
    console.log(`  -> Đã sẵn sàng ${allUsers.length} tài khoản trong hệ thống.`);

    // 5. Đồng bộ Vouchers
    console.log('\n[5/7] Nạp 8 Mã Voucher Khuyến Mãi...');
    for (const v of richVouchers) {
      await Voucher.findOneAndUpdate({ code: v.code }, v, { upsert: true, new: true });
    }
    const voucherDocs = await Voucher.find();
    console.log(`  -> Đã nạp thành công ${voucherDocs.length} mã voucher khuyến mãi.`);

    // 6. Nạp Đơn Hàng Mẫu Phong Phú (KDS & Shift Reports)
    console.log('\n[6/7] Nạp 36 Đơn Hàng Phong Phú Đa Dạng (KDS & Báo Cáo Ca)...');
    await Order.deleteMany({ orderCode: { $regex: /^FB-(LIVE|HIST)-/ } });

    const orderStatuses = ['Received', 'Preparing', 'Ready for Pickup', 'Completed', 'Completed', 'Completed', 'Cancelled'];
    const paymentMethods = ['CASH_AT_COUNTER', 'PAYOS', 'MOCK_MOMO'];
    const pickupTimes = ['15_MINS', '30_MINS', '45_MINS', 'CUSTOM'];

    const ordersToInsert = [];
    const customerList = allUsers.filter(u => u.role === 'user');

    // Tạo 16 đơn hàng phát sinh trong ngày HÔM NAY
    const now = new Date();
    for (let i = 1; i <= 16; i++) {
      const branch = branchDocs[(i - 1) % branchDocs.length];
      const customer = customerList[(i - 1) % customerList.length];
      const prodA = productDocs[(i * 2) % productDocs.length];
      const prodB = productDocs[(i * 3 + 1) % productDocs.length];

      const itemQtyA = 1 + (i % 2);
      const itemQtyB = 1;
      const subtotal = prodA.price * itemQtyA + prodB.price * itemQtyB;
      const hasDiscount = i % 3 === 0;
      const discount = hasDiscount ? 15000 : 0;
      const totalAmount = Math.max(0, subtotal - discount);

      // Phân bổ trạng thái KDS hôm nay
      let status;
      if (i <= 3) status = 'Received';
      else if (i <= 6) status = 'Preparing';
      else if (i <= 9) status = 'Ready for Pickup';
      else if (i <= 14) status = 'Completed';
      else status = 'Cancelled';

      const createdAt = new Date(now.getTime() - (i * 25) * 60 * 1000); // lùi từ vài chục phút đến vài giờ

      ordersToInsert.push({
        orderCode: `FB-LIVE-${1000 + i}`,
        userId: customer._id,
        branchId: branch._id,
        items: [
          {
            productId: prodA._id,
            name: prodA.name,
            size: i % 2 === 0 ? 'M' : 'S',
            quantity: itemQtyA,
            price: prodA.price,
            sugarLevel: i % 2 === 0 ? '70%' : '100%',
            iceLevel: '100%',
            note: i === 1 ? 'Ít ngọt, nhiều đá giúp mình' : ''
          },
          {
            productId: prodB._id,
            name: prodB.name,
            size: 'L',
            quantity: itemQtyB,
            price: prodB.price,
            sugarLevel: '100%',
            iceLevel: i % 3 === 0 ? 'Nóng' : '50%',
            note: ''
          }
        ],
        subtotal,
        discount,
        voucherCode: hasDiscount ? 'FRESHBITE20' : null,
        totalAmount,
        pickupTime: pickupTimes[i % pickupTimes.length],
        status,
        paymentMethod: paymentMethods[i % paymentMethods.length],
        paymentStatus: status === 'Completed' ? 'PAID' : (i % 2 === 0 ? 'PAID' : 'PENDING'),
        createdAt,
        updatedAt: createdAt
      });
    }

    // Tạo 20 đơn hàng phát sinh trong những NGÀY TRƯỚC ĐÓ (Lịch sử doanh thu)
    for (let j = 1; j <= 20; j++) {
      const branch = branchDocs[j % branchDocs.length];
      const customer = customerList[j % customerList.length];
      const prodA = productDocs[(j * 3) % productDocs.length];
      const prodB = productDocs[(j * 4) % productDocs.length];

      const subtotal = prodA.price * 2 + prodB.price;
      const discount = j % 4 === 0 ? 30000 : 0;
      const totalAmount = Math.max(0, subtotal - discount);

      const daysAgo = 1 + (j % 5);
      const createdAt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (j * 15 * 60 * 1000));

      ordersToInsert.push({
        orderCode: `FB-HIST-${2000 + j}`,
        userId: customer._id,
        branchId: branch._id,
        items: [
          {
            productId: prodA._id,
            name: prodA.name,
            size: 'M',
            quantity: 2,
            price: prodA.price,
            sugarLevel: '100%',
            iceLevel: '100%'
          },
          {
            productId: prodB._id,
            name: prodB.name,
            size: 'S',
            quantity: 1,
            price: prodB.price,
            sugarLevel: '50%',
            iceLevel: '50%'
          }
        ],
        subtotal,
        discount,
        voucherCode: discount > 0 ? 'CHAOBANMOI' : null,
        totalAmount,
        pickupTime: '15_MINS',
        status: j % 10 === 0 ? 'Cancelled' : 'Completed',
        paymentMethod: paymentMethods[j % paymentMethods.length],
        paymentStatus: j % 10 === 0 ? 'PENDING' : 'PAID',
        createdAt,
        updatedAt: createdAt
      });
    }

    await Order.insertMany(ordersToInsert);
    const totalOrdersCount = await Order.countDocuments();
    console.log(`  -> Đã nạp thành công 36 đơn hàng mới. Tổng số đơn hàng trong DB: ${totalOrdersCount}.`);

    // 7. Nạp Đánh Giá Món Ăn (Reviews) Chân Thực
    console.log('\n[7/7] Nạp 26 Đánh Giá Món Ăn & Phản Hồi Khách Hàng...');
    await Review.deleteMany({});

    const sampleComments = [
      { rating: 5, comment: 'Cà phê muối ở đây ngon đỉnh chóp, kem béo ngậy vừa miệng không hề bị mặn gắt.' },
      { rating: 5, comment: 'Cold brew cam vàng Sơn Trà vị thanh mát, rất thơm hương cam tươi, uống sảng khoái ngày nắng.' },
      { rating: 5, comment: 'Bánh croissant giòn tan thơm lừng bơ Pháp, sốt trứng muối ngập ngụa béo bùi siêu ngon.' },
      { rating: 5, comment: 'View sông Bạch Đằng ngồi ngắm cầu Rồng tuyệt đẹp, nhân viên quầy phục vụ rất thân thiện nhiệt tình.' },
      { rating: 4, comment: 'Cà phê dừa non xay rất thơm béo, lượng đá vừa phải, lần sau sẽ ủng hộ tiếp.' },
      { rating: 5, comment: 'Matcha Uji đậu đỏ chuẩn vị Nhật Bản, thơm đậm mùi trà xanh thanh khiết không bị ngọt gắt.' },
      { rating: 5, comment: 'Bạc xỉu kem trứng đẹp mắt 3 tầng, kem trứng đánh bông sánh vàng thơm béo ngậy.' },
      { rating: 4, comment: 'Trà lài hạt sen hạt sen mềm bùi nấu đường phèn thanh tao, uống thư giãn buổi chiều.' },
      { rating: 5, comment: 'Chi nhánh FPT City rộng rãi, wifi căng đét, cà phê ngon rất hợp để ngồi làm việc cả ngày.' },
      { rating: 5, comment: 'Tiramisu cà phê dừa mềm mịn tan trong miệng, hương vị độc đáo không quán nào có.' },
      { rating: 4, comment: 'Trà đào cam sả miếng đào giòn ngọt, sả thơm nồng ấm họng.' },
      { rating: 5, comment: 'Đồ uống ra nhanh, đóng gói ly giấy thân thiện môi trường, 10 điểm chất lượng.' },
      { rating: 3, comment: 'Hôm nay quán hơi đông nên phải chờ khoảng 10 phút, nhưng nước vẫn rất ngon.' },
      { rating: 5, comment: 'Bánh biscotti giòn rụm nhiều hạt hạnh nhân, ăn kiêng healthy mà vẫn rất cuốn.' },
      { rating: 5, comment: 'App đặt nước hẹn giờ lấy rất tiện, mình tới quầy là có sẵn không phải xếp hàng chờ.' },
      { rating: 4, comment: 'Sinh tố bơ sáp sánh mịn béo ngậy, đúng chuẩn bơ sáp Đắk Lắk tươi ngon.' },
      { rating: 5, comment: 'Voucher giảm 20% áp dụng mượt mà, giá cả hạt dẻ so với chất lượng specialty.' },
      { rating: 5, comment: 'Chi nhánh Võ Văn Kiệt gần biển gió mát rượi, cà phê phin sữa đậm đà chuẩn gu miền Trung.' },
      { rating: 4, comment: 'Trà Oolong mãng cầu chua ngọt hài hòa, thạch giòn sần sật ăn rất thích.' },
      { rating: 5, comment: 'Không gian ấm cúng, nhạc lofi dễ chịu, cà phê muối là món nhất định phải thử khi đến Đà Nẵng.' },
      { rating: 1, comment: 'Quảng cáo spam linh tinh mời chào group tài chính không liên quan.', isHidden: true },
      { rating: 2, comment: 'Bình luận chứa từ ngữ thô tục không phù hợp tiêu chuẩn cộng đồng.', isHidden: true }
    ];

    const reviewsToInsert = [];
    sampleComments.forEach((c, idx) => {
      const prod = productDocs[idx % productDocs.length];
      const branch = branchDocs[idx % branchDocs.length];
      const cust = customerList[idx % customerList.length];
      const reviewDate = new Date(now.getTime() - (idx * 6) * 60 * 60 * 1000);

      reviewsToInsert.push({
        userId: cust._id,
        productId: prod._id,
        branchId: branch._id,
        rating: c.rating,
        comment: c.comment,
        isHidden: Boolean(c.isHidden),
        createdAt: reviewDate,
        updatedAt: reviewDate
      });
    });

    await Review.insertMany(reviewsToInsert);
    console.log(`  -> Đã nạp thành công ${reviewsToInsert.length} đánh giá khách hàng (có 2 bài ẩn kiểm duyệt).`);

    // 8. Nạp Tin Nhắn Live Chat CSKH 2 Chiều
    console.log('\n[8/8] Nạp 30+ Tin Nhắn Live Chat 2 Chiều Giữa Khách Và Quầy...');
    await Message.deleteMany({});

    const branch1 = branchDocs[0]; // FPT City
    const branch2 = branchDocs[1]; // Bạch Đằng
    const branch3 = branchDocs[2]; // Sơn Trà
    const branch4 = branchDocs[3]; // Điện Biên Phủ

    const cust1 = userMap['hoang.dev@fpt.edu.vn'];
    const cust2 = userMap['linh.danang@gmail.com'];
    const cust3 = userMap['tuan.travel@gmail.com'];
    const cust4 = userMap['phuong.designer@gmail.com'];
    const cust5 = userMap['mai.coffee@gmail.com'];

    const chatThreads = [
      // Cuộc trò chuyện 1: Hoàng Nam @ FPT City
      {
        branchId: branch1._id,
        userId: cust1._id,
        senderRole: 'customer',
        senderName: cust1.fullName,
        content: 'Chào quầy FPT City, mình vừa đặt đơn 2 ly cà phê muối qua app, làm giúp mình ít ngọt và nhiều đá nhé.',
        createdAt: new Date(now.getTime() - 40 * 60 * 1000),
        isRead: true
      },
      {
        branchId: branch1._id,
        userId: cust1._id,
        senderRole: 'staff',
        senderName: 'Barista FPT City',
        content: 'Dạ chào anh Nam, quầy đã nhận thông tin và đang pha chế đúng yêu cầu 50% đường nhiều đá cho anh rồi ạ!',
        createdAt: new Date(now.getTime() - 35 * 60 * 1000),
        isRead: true
      },
      {
        branchId: branch1._id,
        userId: cust1._id,
        senderRole: 'customer',
        senderName: cust1.fullName,
        content: 'Cảm ơn bạn nhé, khoảng 10 phút nữa mình xuống sảnh F-Complex nhận nước.',
        createdAt: new Date(now.getTime() - 25 * 60 * 1000),
        isRead: true
      },
      {
        branchId: branch1._id,
        userId: cust1._id,
        senderRole: 'staff',
        senderName: 'Barista FPT City',
        content: 'Dạ vé pha chế đã hoàn tất sẵn sàng tại quầy Pick-up rồi ạ. Chúc anh một ngày làm việc tràn đầy năng lượng!',
        createdAt: new Date(now.getTime() - 15 * 60 * 1000),
        isRead: true
      },

      // Cuộc trò chuyện 2: Mỹ Linh @ Bạch Đằng
      {
        branchId: branch2._id,
        userId: cust2._id,
        senderRole: 'customer',
        senderName: cust2.fullName,
        content: 'Shop ơi hiện tại chi nhánh Bạch Đằng ven sông Hàn trên tầng 2 còn bàn trống ngắm cầu Rồng không ạ?',
        createdAt: new Date(now.getTime() - 55 * 60 * 1000),
        isRead: true
      },
      {
        branchId: branch2._id,
        userId: cust2._id,
        senderRole: 'staff',
        senderName: 'Barista Bạch Đằng',
        content: 'Dạ chào chị Linh, khu vực ban công tầng 2 hiện còn 3 bàn trống view rất thoáng đẹp chị nhé.',
        createdAt: new Date(now.getTime() - 48 * 60 * 1000),
        isRead: true
      },
      {
        branchId: branch2._id,
        userId: cust2._id,
        senderRole: 'customer',
        senderName: cust2.fullName,
        content: 'Dạ tuyệt quá, mình đặt trước 1 Cold Brew Cam Vàng và 1 Bánh Croissant bơ tỏi nhé.',
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
        isRead: true
      },
      {
        branchId: branch2._id,
        userId: cust2._id,
        senderRole: 'staff',
        senderName: 'Barista Bạch Đằng',
        content: 'Dạ quầy đã nhận order và chuẩn bị bánh nóng hổi chờ chị ghé ạ!',
        createdAt: new Date(now.getTime() - 20 * 60 * 1000),
        isRead: true
      },

      // Cuộc trò chuyện 3: Quốc Tuấn @ Sơn Trà
      {
        branchId: branch3._id,
        userId: cust3._id,
        senderRole: 'customer',
        senderName: cust3.fullName,
        content: 'Mình từ Hà Nội vào du lịch, muốn mua hạt cà phê rang xay Robusta Đắk Lắk mang về làm quà thì quán có đóng gói sẵn không?',
        createdAt: new Date(now.getTime() - 75 * 60 * 1000),
        isRead: true
      },
      {
        branchId: branch3._id,
        userId: cust3._id,
        senderRole: 'staff',
        senderName: 'Barista Sơn Trà',
        content: 'Dạ FreshBite có gói hạt 250g và 500g nguyên chất có van một chiều giữ hương cực tốt anh Tuấn nhé.',
        createdAt: new Date(now.getTime() - 60 * 60 * 1000),
        isRead: true
      },
      {
        branchId: branch3._id,
        userId: cust3._id,
        senderRole: 'customer',
        senderName: cust3.fullName,
        content: 'Hay quá, lát mình tắm biển Mỹ Khê xong sẽ tạt qua quán lấy 2 gói 500g nha.',
        createdAt: new Date(now.getTime() - 45 * 60 * 1000),
        isRead: true
      },

      // Cuộc trò chuyện 4: Bích Phương @ Điện Biên Phủ
      {
        branchId: branch4._id,
        userId: cust4._id,
        senderRole: 'customer',
        senderName: cust4.fullName,
        content: 'Barista ơi cho mình hỏi trà ô long mãng cầu có thể làm không đường được không ạ?',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        isRead: true
      },
      {
        branchId: branch4._id,
        userId: cust4._id,
        senderRole: 'staff',
        senderName: 'Barista Điện Biên Phủ',
        content: 'Dạ được chị Phương nhé, phần ngọt tự nhiên từ thịt mãng cầu tươi dầm đã rất vừa miệng rồi ạ.',
        createdAt: new Date(now.getTime() - 110 * 60 * 1000),
        isRead: true
      },

      // Cuộc trò chuyện 5 (Tin nhắn MỚI CHƯA ĐỌC từ khách để hiển thị badge): Ngọc Mai @ FPT City
      {
        branchId: branch1._id,
        userId: cust5._id,
        senderRole: 'customer',
        senderName: cust5.fullName,
        content: 'Cho em hỏi mã giảm giá FPTCITY15 có giới hạn số lần dùng trong tuần không ạ?',
        createdAt: new Date(now.getTime() - 8 * 60 * 1000),
        isRead: false
      },

      // Cuộc trò chuyện 6 (Tin nhắn MỚI CHƯA ĐỌC): Mỹ Linh @ FPT City
      {
        branchId: branch1._id,
        userId: cust2._id,
        senderRole: 'customer',
        senderName: cust2.fullName,
        content: 'Quán có xuất hóa đơn đỏ VAT điện tử cho công ty theo đơn hàng qua app không ạ?',
        createdAt: new Date(now.getTime() - 3 * 60 * 1000),
        isRead: false
      }
    ];

    await Message.insertMany(chatThreads);
    console.log(`  -> Đã nạp thành công ${chatThreads.length} tin nhắn hội thoại Live Chat mẫu.`);

    console.log('\n================================================================');
    console.log('  ĐÃ NẠP HOÀN TẤT TOÀN BỘ DỮ LIỆU LỚN THÀNH CÔNG RỰC RỠ!');
    console.log('  - 4 Chi nhánh Đà Nẵng: Sẵn sàng');
    console.log('  - 20 Món ăn đặc sản (size S/M/L): Đầy đủ');
    console.log('  - 14 Tài khoản người dùng (Admin, Staff, Customer): Đầy đủ');
    console.log('  - 8 Mã voucher: Bật, Tắt, Hết hạn phong phú');
    console.log('  - 36 Đơn hàng KDS & Báo cáo ca: Trực quan sống động');
    console.log('  - 22 Đánh giá món ăn: Đầy đủ sao và kiểm duyệt');
    console.log('  - 14 Tin nhắn Live Chat CSKH: Sẵn sàng tương tác');
    console.log('================================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi nạp dữ liệu lớn:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedRichData();
}

module.exports = seedRichData;
