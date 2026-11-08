const fs = require('fs');
const path = require('path');
const os = require('os');
const Order = require('../models/Order');
const Branch = require('../models/Branch');

/**
 * Báo cáo ca & đối soát doanh thu quầy Barista
 * @param {Object} req - query: { branchId, date }
 * @param {Object} res
 * @return {Object} Thống kê đơn hàng và doanh thu ca (200)
 */
exports.getShiftReport = async (req, res) => {
  try {
    const { branchId, date } = req.query;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu branchId trong query params'
      });
    }

    const reportDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      branchId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'Completed');
    const cancelledOrders = orders.filter(o => o.status === 'Cancelled');

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const cashRevenue = completedOrders
      .filter(o => o.paymentMethod === 'CASH_AT_COUNTER')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const digitalRevenue = completedOrders
      .filter(o => o.paymentMethod !== 'CASH_AT_COUNTER')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const discountTotal = orders.reduce((sum, o) => sum + (o.discount || 0), 0);

    const branch = await Branch.findById(branchId).select('name address');

    return res.status(200).json({
      success: true,
      data: {
        branchName: branch ? branch.name : 'Không xác định',
        branchAddress: branch ? branch.address : '',
        reportDate: reportDate.toISOString().split('T')[0],
        totalOrders,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        processingOrders: totalOrders - completedOrders.length - cancelledOrders.length,
        totalRevenue,
        cashRevenue,
        digitalRevenue,
        discountTotal
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Xuất file CSV báo cáo ca tải về qua res.download
 * @param {Object} req - query: { branchId, date }
 * @param {Object} res
 * @return {File} File CSV tải về máy (Slot 12)
 */
exports.exportShiftReport = async (req, res) => {
  try {
    const { branchId, date } = req.query;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu branchId trong query params'
      });
    }

    const reportDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      branchId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('userId', 'fullName phone');

    const branch = await Branch.findById(branchId).select('name address');
    const branchName = branch ? branch.name : 'Branch';
    const dateStr = reportDate.toISOString().split('T')[0];

    const csvRows = [
      '\ufeff"Mã đơn","Khách hàng","Số điện thoại","Hẹn lấy","Phương thức TT","Trạng thái TT","Trạng thái đơn","Tạm tính (VNĐ)","Giảm giá (VNĐ)","Tổng tiền (VNĐ)","Thời gian tạo"'
    ];

    orders.forEach((o) => {
      const customerName = o.userId ? o.userId.fullName : 'Khách vãng lai';
      const customerPhone = o.userId ? o.userId.phone : '';
      csvRows.push(
        `"${o.orderCode}","${customerName}","${customerPhone}","${o.pickupTime}","${o.paymentMethod}","${o.paymentStatus}","${o.status}","${o.subtotal}","${o.discount || 0}","${o.totalAmount}","${o.createdAt.toISOString()}"`
      );
    });

    const csvContent = csvRows.join('\r\n');
    const tempFilePath = path.join(os.tmpdir(), `BaoCaoCa_${branchName.replace(/\s+/g, '_')}_${dateStr}.csv`);

    fs.writeFileSync(tempFilePath, csvContent, 'utf8');

    return res.download(tempFilePath, `BaoCaoCa_${dateStr}.csv`, (err) => {
      if (err && !res.headersSent) {
        return res.status(500).json({
          success: false,
          message: err.message
        });
      }
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupErr) {
        // dọn file tạm
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
