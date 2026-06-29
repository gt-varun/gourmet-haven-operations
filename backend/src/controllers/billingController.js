const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

// @desc    Atomically checkout a POS cart and deduct stock
// @route   POST /api/billing/checkout
// @access  Private
const checkout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, discountRate, payment, branchId } = req.body;
    const actor = req.user;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required' });
    }

    if (!payment || !payment.method) {
      return res.status(400).json({ success: false, message: 'Payment method is required' });
    }

    // Determine target branch
    const targetBranchId = actor.role === 'SUPER_ADMIN' ? branchId : actor.branchId;
    if (!targetBranchId) {
      return res.status(400).json({ success: false, message: 'Branch ID is required for checkout' });
    }

    // Validate cashier discount cap (FR-7, Cashier capped <= 10%)
    const rate = Number(discountRate) || 0;
    if (actor.role === 'CASHIER' && rate > 10) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Cashiers cannot apply discounts greater than 10%',
      });
    }

    let orderSubtotal = 0;
    let orderTaxTotal = 0;
    const orderItems = [];

    // Atomically check stock and decrement (FR-8, FR-9)
    for (const cartItem of items) {
      const { productId, quantity } = cartItem;

      if (!productId || !quantity || quantity <= 0) {
        throw new Error('Invalid product or quantity in cart');
      }

      // Fetch product inside transaction session
      const product = await Product.findOne({
        _id: productId,
        branchId: targetBranchId,
        isDeleted: false,
      }).session(session);

      if (!product) {
        throw new Error(`Product not found or unavailable at this branch`);
      }

      // Check stock limit
      if (product.stock < quantity) {
        throw new Error(`Out of stock: ${product.name} (Available: ${product.stock}, Requested: ${quantity})`);
      }

      // Decrement stock
      product.stock -= quantity;
      await product.save({ session });

      const itemSubtotal = product.price * quantity;
      const itemTaxAmount = itemSubtotal * (product.taxRate / 100);
      const itemTotal = itemSubtotal + itemTaxAmount;

      orderSubtotal += itemSubtotal;
      orderTaxTotal += itemTaxAmount;

      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity,
        price: product.price,
        taxRate: product.taxRate,
        taxAmount: itemTaxAmount,
        subtotal: itemSubtotal,
        total: itemTotal,
      });
    }

    // Calculations
    const discountTotal = Number((orderSubtotal * (rate / 100)).toFixed(2));
    const grandTotal = Number((orderSubtotal + orderTaxTotal - discountTotal).toFixed(2));

    // Create the order document
    const [order] = await Order.create(
      [
        {
          branchId: targetBranchId,
          userId: actor._id,
          items: orderItems,
          subtotal: Number(orderSubtotal.toFixed(2)),
          taxTotal: Number(orderTaxTotal.toFixed(2)),
          discountTotal,
          grandTotal,
          payment: {
            method: payment.method,
            amount: payment.amount || grandTotal,
          },
        },
      ],
      { session }
    );

    // Write audit log for discount override (if discount applied)
    if (rate > 0) {
      await AuditLog.create(
        [
          {
            actorId: actor._id,
            actorEmail: actor.email,
            branchId: targetBranchId,
            action: 'DISCOUNT_OVERRIDE',
            entityType: 'Order',
            entityId: order._id,
            metadata: {
              discountRate: rate,
              discountTotal,
              originalSubtotal: orderSubtotal,
              role: actor.role,
            },
          },
        ],
        { session }
      );
    }

    // Commit changes
    await session.commitTransaction();
    session.endSession();

    // Populate order details for receipt display
    const populatedOrder = await Order.findById(order._id)
      .populate('userId', 'name')
      .populate('branchId', 'name location');

    return res.status(201).json({
      success: true,
      message: 'Order checked out successfully',
      order: populatedOrder,
    });
  } catch (error) {
    // Rollback changes on failure (FR-9)
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Void an order and restore stock (SUPER_ADMIN, ADMIN only)
// @route   POST /api/billing/orders/:id/void
// @access  Private (SUPER_ADMIN, ADMIN)
const voidOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { voidReason } = req.body;
    const actor = req.user;

    if (!voidReason) {
      return res.status(400).json({ success: false, message: 'Please provide a reason for voiding this order' });
    }

    // Fetch order respecting branch isolation (branchFilter applied in controllers)
    const order = await Order.findOne({
      _id: req.params.id,
      ...req.branchFilter,
    }).session(session);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or access denied' });
    }

    if (order.isVoided) {
      return res.status(400).json({ success: false, message: 'Order is already voided' });
    }

    // Restore stock for all items
    for (const item of order.items) {
      const product = await Product.findOne({
        _id: item.productId,
        branchId: order.branchId,
      }).session(session);

      if (product) {
        product.stock += item.quantity;
        await product.save({ session });
      }
    }

    // Mark order as voided
    order.isVoided = true;
    order.voidedBy = actor._id;
    order.voidedAt = Date.now();
    order.voidReason = voidReason;
    await order.save({ session });

    // Record order void in audit log (FR-16)
    await AuditLog.create(
      [
        {
          actorId: actor._id,
          actorEmail: actor.email,
          branchId: order.branchId,
          action: 'ORDER_VOID',
          entityType: 'Order',
          entityId: order._id,
          metadata: {
            voidReason,
            grandTotal: order.grandTotal,
            cashierId: order.userId,
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: 'Order voided successfully and inventory restored',
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get order history (respects branchFilter)
// @route   GET /api/billing/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      ...req.branchFilter,
    })
      .populate('userId', 'name')
      .populate('branchId', 'name')
      .populate('voidedBy', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  checkout,
  voidOrder,
  getOrders,
};
