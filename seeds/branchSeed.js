require('dotenv').config();
const mongoose = require('mongoose');
const Branch = require('../models/Branch');

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

const seedBranches = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Không thể chạy script seed trên môi trường Production!');
    }

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI không tồn tại trong file .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Đã kết nối MongoDB để nạp dữ liệu chi nhánh...');

    // Xóa các chi nhánh trùng tên mẫu
    const names = branches.map((b) => b.name);
    await Branch.deleteMany({ name: { $in: names } });

    const inserted = await Branch.insertMany(branches);
    console.log(`Đã nạp thành công ${inserted.length} chi nhánh Đà Nẵng:`);
    inserted.forEach((b, idx) => {
      console.log(`  ${idx + 1}. [${b.district}] ${b.name} (${b.latitude}, ${b.longitude})`);
    });

    await mongoose.disconnect();
    console.log('Hoàn tất nạp dữ liệu chi nhánh!');
    process.exit(0);
  } catch (error) {
    console.error(`Lỗi khi nạp dữ liệu chi nhánh: ${error.message}`);
    process.exit(1);
  }
};

seedBranches();
