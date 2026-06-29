const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  restockProduct,
  deleteProduct,
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const branchScope = require('../middleware/branchScope');

const router = express.Router();

router.use(authenticate); // Require authentication for all catalog routes

// GET products (CASHIER can read their branch's products, ADMIN reads own, SUPER_ADMIN reads all)
router.get('/', branchScope, getProducts);
router.get('/:id', branchScope, getProductById);

// Create products (requires ADMIN level or higher)
router.post('/', authorize('ADMIN'), createProduct);

// Modify products (requires ADMIN level + scoped branch validation)
router.put('/:id', authorize('ADMIN'), branchScope, updateProduct);
router.put('/:id/restock', authorize('ADMIN'), branchScope, restockProduct);
router.delete('/:id', authorize('ADMIN'), branchScope, deleteProduct);

module.exports = router;
