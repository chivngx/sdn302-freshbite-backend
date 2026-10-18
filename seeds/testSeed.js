require('dotenv').config();
const mongoose = require('mongoose');
const Branch = require('../models/Branch');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');

const IMG = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'; // ảnh tạm, thay sau

const branches = [
    { name: 'FreshBite FPT City (Ngũ Hành Sơn)', address: 'Tòa F-Complex, Khu đô thị FPT City, P. Hòa Hải, Q. Ngũ Hành Sơn, Đà Nẵng', district: 'Ngũ Hành Sơn', latitude: 15.969234, longitude: 108.261221, phone: '0236.730.0999', openingHours: '06:30 - 22:00', imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800' },
    { name: 'FreshBite Bạch Đằng (Hải Châu)', address: '154 Bạch Đằng, P. Hải Châu 1, Q. Hải Châu, Đà Nẵng', district: 'Hải Châu', latitude: 16.067822, longitude: 108.220815, phone: '0236.388.8222', openingHours: '06:30 - 23:00', imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800' },
    { name: 'FreshBite Võ Văn Kiệt (Sơn Trà)', address: '68 Võ Văn Kiệt, P. An Hải Đông, Q. Sơn Trà, Đà Nẵng', district: 'Sơn Trà', latitude: 16.061044, longitude: 108.238055, phone: '0236.399.9111', openingHours: '06:30 - 22:30', imageUrl: IMG },
    { name: 'FreshBite Điện Biên Phủ (Thanh Khê)', address: '242 Điện Biên Phủ, P. Chính Gián, Q. Thanh Khê, Đà Nẵng', district: 'Thanh Khê', latitude: 16.062011, longitude: 108.185012, phone: '0236.377.7333', openingHours: '07:00 - 22:00', imageUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800' },
];

const categories = [
    { name: 'Cà phê', code: 'coffee', description: 'Cà phê đặc sản Đà Nẵng', icon: 'coffee' },
    { name: 'Bánh thủ công', code: 'bakery', description: 'Bánh nướng mỗi ngày', icon: 'cake' },
    { name: 'Trà', code: 'tea', description: 'Trà thanh mát', icon: 'leaf' },
    { name: 'Đặc biệt', code: 'specialty', description: 'Thức uống signature', icon: 'star' },
];

// [tên, code danh mục, giá, kcal, bestSeller, còn hàng, nguyên liệu]
const productRows = [
    ['Cà phê Muối Đà Nẵng', 'coffee', 32000, 180, true, true, ['Cà phê Robusta Đắk Lắk', 'Muối hồng', 'Sữa đặc']],
    ['Cold Brew Cam Vàng Sơn Trà', 'coffee', 45000, 80, true, true, ['Cà phê cold brew', 'Cam vàng Sơn Trà']],
    ['Cà phê Dừa Non Xay', 'specialty', 42000, 260, false, true, ['Cà phê', 'Dừa non', 'Sữa']],
    ['Trà Lài Hạt Sen Cố Đô', 'tea', 38000, 120, false, true, ['Trà lài', 'Hạt sen']],
    ['Bánh Croissant Bơ Tỏi Trứng Muối', 'bakery', 35000, 310, true, true, ['Bột mì', 'Bơ', 'Tỏi', 'Trứng muối']],
    ['Bánh Tiramisu Vị Cà Phê Cốt Dừa', 'bakery', 45000, 280, false, true, ['Mascarpone', 'Cà phê', 'Cốt dừa']],
    ['Bánh Biscotti Yến Mạch Hạnh Nhân', 'bakery', 28000, 110, false, true, ['Yến mạch', 'Hạnh nhân']],
    ['Bánh Mì Que Pate (Hết hàng)', 'bakery', 20000, 200, false, false, ['Bột mì', 'Pate']], // để test lỗi 400 món hết hàng
];

(async () => {
    if (process.env.NODE_ENV === 'production') throw new Error('Không seed trên production!');
    await mongoose.connect(process.env.MONGO_URI);

    await Promise.all([Branch.deleteMany(), Category.deleteMany(), Product.deleteMany(), Order.deleteMany()]);

    await Branch.insertMany(branches);
    const cats = await Category.insertMany(categories);
    const catId = Object.fromEntries(cats.map((c) => [c.code, c._id]));

    await Product.insertMany(
        productRows.map(([name, code, price, calories, isBestSeller, isAvailable, ingredients]) => ({
            name, categoryId: catId[code], price, calories, isBestSeller, isAvailable, ingredients,
            description: `${name} - đặc sản FreshBite Đà Nẵng`, imageUrl: IMG,
        }))
    );

    console.log('Seed xong: 4 chi nhánh, 4 danh mục, 8 sản phẩm');
    await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });