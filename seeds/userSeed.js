require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const users = [
    { fullName: 'Admin FreshBite', email: 'admin@freshbite.com', password: '123456', phone: '0987654321', role: 'admin' },
    { fullName: 'Nguyen Van Test', email: 'user@freshbite.com', password: '123456', phone: '0912345678', role: 'user' },
    { fullName: 'Tran Thi Khach', email: 'user2@freshbite.com', password: '123456', phone: '0933456789', role: 'user' },
];

(async () => {
    if (process.env.NODE_ENV === 'production') throw new Error('Không seed trên production!');
    await mongoose.connect(process.env.MONGO_URI);

    // Chỉ xóa đúng các email test, không đụng tới user thật của đồng đội
    await User.deleteMany({ email: { $in: users.map((u) => u.email) } });

    // Dùng create (từng user) thay vì insertMany để hook hash password chạy
    for (const u of users) {
        const created = await User.create(u);
        const token = jwt.sign({ id: created._id, role: created.role }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        });
        console.log(`\n[${created.role}] ${created.email}\nTOKEN: ${token}`);
    }

    console.log('\nSeed users xong. Mật khẩu chung: 123456');
    await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });