const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

// Helper to write audit logs
const writeAuditLog = async ({ actor, action, entityId, branchId, metadata }) => {
  try {
    await AuditLog.create({
      actorId: actor._id,
      actorEmail: actor.email,
      branchId: branchId || actor.branchId || null,
      action,
      entityType: 'Product',
      entityId,
      metadata,
    });
  } catch (error) {
    console.error('Audit logging failed:', error.message);
  }
};

// @desc    Get all products (respects branchFilter)
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    // req.branchFilter is set by branchScope middleware
    const products = await Product.find({
      ...req.branchFilter,
      isDeleted: false,
    }).populate('branchId', 'name');

    return res.status(200).json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get product by ID (respects branchFilter)
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      ...req.branchFilter,
      isDeleted: false,
    }).populate('branchId', 'name');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product (SUPER_ADMIN, ADMIN)
// @route   POST /api/products
// @access  Private (SUPER_ADMIN, ADMIN)
const createProduct = async (req, res) => {
  try {
    const { name, sku, price, taxRate, stock, reorderLevel, category, branchId } = req.body;
    const actor = req.user;

    if (!name || !sku || price === undefined || stock === undefined || reorderLevel === undefined) {
      return res.status(400).json({ success: false, message: 'Please enter all required fields' });
    }

    // Determine target branch
    const targetBranchId = actor.role === 'SUPER_ADMIN' ? branchId : actor.branchId;
    if (!targetBranchId) {
      return res.status(400).json({ success: false, message: 'Branch ID is required' });
    }

    // Check duplicate SKU under the same branch (excluding soft deleted products)
    const duplicate = await Product.findOne({
      branchId: targetBranchId,
      sku,
      isDeleted: false,
    });

    if (duplicate) {
      return res.status(400).json({ success: false, message: `SKU '${sku}' already exists in this branch` });
    }

    // Create product
    const product = await Product.create({
      name,
      sku,
      price,
      taxRate: taxRate !== undefined ? taxRate : 18,
      stock,
      reorderLevel,
      category: category || 'General',
      branchId: targetBranchId,
    });

    return res.status(201).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product (SUPER_ADMIN, ADMIN)
// @route   PUT /api/products/:id
// @access  Private (SUPER_ADMIN, ADMIN)
const updateProduct = async (req, res) => {
  try {
    const { name, sku, price, taxRate, reorderLevel, category } = req.body;

    // Fetch product respecting branchFilter
    const product = await Product.findOne({
      _id: req.params.id,
      ...req.branchFilter,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or access denied' });
    }

    // If SKU is being updated, verify it is unique under the branch
    if (sku && sku !== product.sku) {
      const duplicate = await Product.findOne({
        branchId: product.branchId,
        sku,
        isDeleted: false,
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: `SKU '${sku}' already exists in this branch` });
      }
      product.sku = sku;
    }

    // Apply updates (exclude direct stock updates, which must go through billing or restock audit)
    if (name) product.name = name;
    if (price !== undefined) product.price = price;
    if (taxRate !== undefined) product.taxRate = taxRate;
    if (reorderLevel !== undefined) product.reorderLevel = reorderLevel;
    if (category) product.category = category;

    await product.save();

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restock a product (SUPER_ADMIN, ADMIN) - audits inventory restock (FR-11, FR-16)
// @route   PUT /api/products/:id/restock
// @access  Private (SUPER_ADMIN, ADMIN)
const restockProduct = async (req, res) => {
  try {
    const { quantity } = req.body;
    const actor = req.user;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a restock quantity greater than 0' });
    }

    // Fetch product respecting branchFilter
    const product = await Product.findOne({
      _id: req.params.id,
      ...req.branchFilter,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or access denied' });
    }

    const oldStock = product.stock;
    product.stock += Number(quantity);
    await product.save();

    // Log restock action
    await writeAuditLog({
      actor,
      action: 'INVENTORY_RESTOCK',
      entityId: product._id,
      branchId: product.branchId,
      metadata: {
        productName: product.name,
        sku: product.sku,
        addedQuantity: Number(quantity),
        oldStock,
        newStock: product.stock,
      },
    });

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Soft delete a product (SUPER_ADMIN, ADMIN)
// @route   DELETE /api/products/:id
// @access  Private (SUPER_ADMIN, ADMIN)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      ...req.branchFilter,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or access denied' });
    }

    product.isDeleted = true;
    await product.save();

    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  restockProduct,
  deleteProduct,
};
