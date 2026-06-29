const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get dashboard metrics (Today's Sales, Orders, Top Items, Low Stock)
// @route   GET /api/reports/dashboard
// @access  Private (SUPER_ADMIN, ADMIN)
const getDashboardMetrics = async (req, res) => {
  try {
    // Scoping check (branchFilter is enforced by middleware)

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Build filters (Cast string branchId to ObjectId for Aggregation pipelines)
    let matchFilter = {
      isVoided: false,
      createdAt: { $gte: startOfDay },
    };

    let productFilter = {
      isDeleted: false,
    };

    if (req.branchFilter.branchId) {
      const bId = new mongoose.Types.ObjectId(req.branchFilter.branchId);
      matchFilter.branchId = bId;
      productFilter.branchId = bId;
    }

    // 1. Fetch Orders for Today (Sales + Count)
    const ordersToday = await Order.find({
      ...req.branchFilter,
      isVoided: false,
      createdAt: { $gte: startOfDay },
    });

    const salesToday = ordersToday.reduce((acc, order) => acc + order.grandTotal, 0);
    const orderCountToday = ordersToday.length;

    // 2. Fetch Low Stock Items (stock <= reorderLevel)
    const lowStockItems = await Product.find({
      ...productFilter,
      $expr: { $lte: ['$stock', '$reorderLevel'] },
    }).populate('branchId', 'name');

    // 3. Aggregate Top Selling Items Today
    const topSellingItems = await Order.aggregate([
      {
        $match: matchFilter,
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          quantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
      {
        $sort: { quantitySold: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    return res.status(200).json({
      success: true,
      metrics: {
        salesToday: Number(salesToday.toFixed(2)),
        orderCountToday,
        lowStockCount: lowStockItems.length,
        lowStockItems,
        topSellingItems,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardMetrics,
};
