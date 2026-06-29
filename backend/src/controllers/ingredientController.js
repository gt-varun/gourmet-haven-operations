const Ingredient = require('../models/Ingredient');

// @desc    Get all ingredients (respects branch scoping via branchFilter)
// @route   GET /api/ingredients
// @access  Private
const getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({
      ...req.branchFilter,
      isDeleted: false,
    }).populate('branchId', 'name');

    return res.status(200).json({ success: true, ingredients });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create an ingredient
// @route   POST /api/ingredients
// @access  Private (SUPER_ADMIN, ADMIN, CASHIER with access)
const createIngredient = async (req, res) => {
  try {
    const { name, quantity, unit, branchId } = req.body;
    const actor = req.user;

    if (!name || quantity === undefined || !unit) {
      return res.status(400).json({ success: false, message: 'Please enter all required fields' });
    }

    // Determine target branch
    const targetBranchId = actor.role === 'SUPER_ADMIN' ? branchId : actor.branchId;
    if (!targetBranchId) {
      return res.status(400).json({ success: false, message: 'Branch assignment is required' });
    }

    // Check duplicates under the active branch
    const duplicate = await Ingredient.findOne({
      branchId: targetBranchId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      isDeleted: false,
    });

    if (duplicate) {
      return res.status(400).json({ success: false, message: `Ingredient '${name}' already exists in this branch` });
    }

    // Create ingredient
    const ingredient = await Ingredient.create({
      name: name.trim(),
      quantity: Number(quantity),
      unit: unit.trim(),
      branchId: targetBranchId,
    });

    return res.status(201).json({ success: true, ingredient });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an ingredient
// @route   PUT /api/ingredients/:id
// @access  Private (SUPER_ADMIN, ADMIN, CASHIER with access)
const updateIngredient = async (req, res) => {
  try {
    const { name, quantity, unit } = req.body;

    const ingredient = await Ingredient.findOne({
      _id: req.params.id,
      ...req.branchFilter,
      isDeleted: false,
    });

    if (!ingredient) {
      return res.status(404).json({ success: false, message: 'Ingredient not found or access denied' });
    }

    // Validate duplicate name if name is changed
    if (name && name.trim().toLowerCase() !== ingredient.name.toLowerCase()) {
      const duplicate = await Ingredient.findOne({
        branchId: ingredient.branchId,
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        isDeleted: false,
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: `Ingredient '${name}' already exists in this branch` });
      }
      ingredient.name = name.trim();
    }

    if (quantity !== undefined) ingredient.quantity = Number(quantity);
    if (unit) ingredient.unit = unit.trim();

    await ingredient.save();

    return res.status(200).json({ success: true, ingredient });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Soft delete an ingredient
// @route   DELETE /api/ingredients/:id
// @access  Private (SUPER_ADMIN, ADMIN, CASHIER with access)
const deleteIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findOne({
      _id: req.params.id,
      ...req.branchFilter,
      isDeleted: false,
    });

    if (!ingredient) {
      return res.status(404).json({ success: false, message: 'Ingredient not found or access denied' });
    }

    ingredient.isDeleted = true;
    await ingredient.save();

    return res.status(200).json({ success: true, message: 'Ingredient deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
};
