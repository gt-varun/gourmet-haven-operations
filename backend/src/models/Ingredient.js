const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add an ingredient name'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Please specify quantity'],
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Please specify unit (e.g. kg, L, pcs)'],
      trim: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
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

// Indexes to speed up queries by branch and soft delete state
ingredientSchema.index({ branchId: 1, isDeleted: 1 });

// Ensure unique ingredient names per branch when active
ingredientSchema.index(
  { branchId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

module.exports = mongoose.model('Ingredient', ingredientSchema);
