const Branch = require('../models/Branch');

// @desc    Get all branches (SUPER_ADMIN sees all, ADMIN/CASHIER see only their own)
// @route   GET /api/branches
// @access  Private
const getBranches = async (req, res) => {
  try {
    const { role, branchId } = req.user;

    if (role === 'SUPER_ADMIN') {
      const branches = await Branch.find({ isDeleted: false });
      return res.status(200).json({ success: true, branches });
    } else {
      if (!branchId) {
        return res.status(400).json({ success: false, message: 'User does not have an assigned branch' });
      }
      const branch = await Branch.findOne({ _id: branchId, isDeleted: false });
      return res.status(200).json({ success: true, branches: branch ? [branch] : [] });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a branch (SUPER_ADMIN only)
// @route   POST /api/branches
// @access  Private (SUPER_ADMIN)
const createBranch = async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Branch name is required' });
    }

    const branch = await Branch.create({
      name,
      location,
      businessId: req.user.businessId || null, // If business context is needed, we link it
    });

    return res.status(201).json({ success: true, branch });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a branch (SUPER_ADMIN only)
// @route   PUT /api/branches/:id
// @access  Private (SUPER_ADMIN)
const updateBranch = async (req, res) => {
  try {
    const { name, location } = req.body;
    const branch = await Branch.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { name, location },
      { new: true, runValidators: true }
    );

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    return res.status(200).json({ success: true, branch });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Soft delete a branch (SUPER_ADMIN only)
// @route   DELETE /api/branches/:id
// @access  Private (SUPER_ADMIN)
const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    return res.status(200).json({ success: true, message: 'Branch deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
};
