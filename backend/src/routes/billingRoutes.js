const express = require('express');
const { checkout, voidOrder, getOrders } = require('../controllers/billingController');
const { authenticate, authorize } = require('../middleware/auth');
const branchScope = require('../middleware/branchScope');

const router = express.Router();

router.use(authenticate); // Require authentication for all billing flows

// Orders history (scoped to branch)
router.get('/orders', branchScope, getOrders);

// Checkout endpoint (CASHIER, ADMIN, SUPER_ADMIN can sell)
router.post('/checkout', checkout);

// Void order endpoint (ADMIN and SUPER_ADMIN only, scoped to branch)
router.post('/orders/:id/void', authorize('ADMIN'), branchScope, voidOrder);

module.exports = router;
