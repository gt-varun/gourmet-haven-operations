const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'Please add a product SKU'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price cannot be negative'],
    },
    taxRate: {
      type: Number,
      default: 18, // Configurable % (e.g. 18% GST/VAT by default)
      min: [0, 'Tax rate cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Please specify stock quantity'],
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    reorderLevel: {
      type: Number,
      required: [true, 'Please specify reorder threshold level'],
      default: 10,
      min: [0, 'Reorder level cannot be negative'],
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of SKU per active branch, and speed up branch filtering
productSchema.index(
  { branchId: 1, sku: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Index on branchId and isDeleted to support listing products per branch
productSchema.index({ branchId: 1, isDeleted: 1 });

module.exports = mongoose.model('Product', productSchema);
