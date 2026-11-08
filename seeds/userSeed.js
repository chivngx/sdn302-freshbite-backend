/**
 * Script: Seed Tài Khoản Kiểm Thử Hệ Thống (User Seed)
 * Tác giả: Lê Tự Nhật Thạch (Uploads, Seed Data & Web Admin SSR Lead)
 * Bài học tích hợp: Slot 8-10 - Xác thực JWT, Bcrypt Hashing, Pre-save Hooks
 *
 * ĐIỂM SỐNG CÒN KHI VẤN ĐÁP:
 * Tại sao phải dùng User.create() thay vì chèn hàng loạt thô (bulk insert)?
 * -> Vì trong models/User.js có cài đặt hook pre('save') để băm mật khẩu qua bcrypt.
 *    Hàm User.create() kích hoạt save() trên từng document nên mật khẩu được băm an toàn.
 *    Nếu chèn dữ liệu thô hàng loạt, MongoDB sẽ lưu chuỗi plain text, khiến user không đăng nhập được!
 */

require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const usersToSeed = [
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

const seedUsers = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Không được chạy seed tài khoản trên production!');
    }

    if (!process.env.MONGO_URI) {
      throw new Error('Thiếu MONGO_URI trong tệp .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('================================================================');
    console.log('  BẮT ĐẦU SEED TÀI KHOẢN KIỂM THỬ (BĂM MẬT KHẨU VỚI BCRYPT)');
    console.log('  Tác giả: Lê Tự Nhật Thạch');
    console.log('================================================================');

    // Chỉ xóa các email test để không làm ảnh hưởng dữ liệu khác
    const testEmails = usersToSeed.map((u) => u.email);
    await User.deleteMany({ email: { $in: testEmails } });
    console.log(`[1] Đã dọn dẹp các tài khoản test cũ.`);

    console.log(`[2] Đang tạo mới và băm mật khẩu tự động qua User.create()...\n`);

    for (const u of usersToSeed) {
      // Dùng User.create để kích hoạt pre('save') băm Bcrypt salt 10
      const createdUser = await User.create(u);

      // Tạo sẵn Bearer Token (7 ngày) để đồng đội dùng trực tiếp trong Postman
      const token = jwt.sign(
        { id: createdUser._id, role: createdUser.role },
        process.env.JWT_SECRET || 'FreshBite_DaNang_Master_Secret_Key_2026_FPT_University',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      console.log(`----------------------------------------------------------------`);
      console.log(`👤 HỌ TÊN   : ${createdUser.fullName}`);
      console.log(`📧 EMAIL    : ${createdUser.email}`);
      console.log(`🔑 PASSWORD : 123456 (Đã băm Bcrypt 60 ký tự trong DB)`);
      console.log(`🛡️ VAI TRÒ  : ${createdUser.role.toUpperCase()}`);
      console.log(`🎫 TOKEN (7d):\nBearer ${token}`);
    }

    console.log(`\n================================================================`);
    console.log(`  HOÀN TẤT SEED TÀI KHOẢN! MẬT KHẨU CHUNG CHO TẤT CẢ USER LÀ: 123456`);
    console.log(`================================================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi seed tài khoản:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedUsers();
}

module.exports = { seedUsers };
