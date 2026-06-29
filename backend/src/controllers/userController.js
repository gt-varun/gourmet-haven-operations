const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Helper to write audit logs
const writeAuditLog = async ({ actor, action, entityId, branchId, metadata }) => {
  try {
    await AuditLog.create({
      actorId: actor._id,
      actorEmail: actor.email,
      branchId: branchId || actor.branchId || null,
      action,
      entityType: 'User',
      entityId,
      metadata,
    });
  } catch (error) {
    console.error('Audit logging failed:', error.message);
  }
};

// @desc    Get all users (SUPER_ADMIN sees all, ADMIN sees cashiers in own branch)
// @route   GET /api/users
// @access  Private (SUPER_ADMIN, ADMIN)
const getUsers = async (req, res) => {
  try {
    const { role, branchId } = req.user;

    let filter = { isDeleted: false };

    if (role === 'ADMIN') {
      // Admins only see users in their own branch
      filter.branchId = branchId;
    } else if (role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Populate branch details
    const users = await User.find(filter).populate('branchId', 'name');
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a user
// @route   POST /api/users
// @access  Private (SUPER_ADMIN, ADMIN)
const createUser = async (req, res) => {
  try {
        const { name, email, password, role, branchId, hasIngredientsAccess } = req.body;
    const actor = req.user;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please enter all required fields' });
    }

    // Role Hierarchy Gating
    if (actor.role === 'ADMIN') {
      // Admin can only create CASHIER roles in their own branch
      if (role !== 'CASHIER') {
        return res.status(403).json({ success: false, message: 'Admins can only create CASHIER accounts' });
      }
      if (branchId && branchId.toString() !== actor.branchId.toString()) {
        return res.status(403).json({ success: false, message: 'Admins can only create users for their own branch' });
      }
    } else if (actor.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check if user already exists (even if soft-deleted, we handle it)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isDeleted) {
        // Reactivate soft-deleted user
        existingUser.isDeleted = false;
        existingUser.name = name;
        existingUser.password = password;
        existingUser.role = role;
        existingUser.branchId = actor.role === 'ADMIN' ? actor.branchId : (branchId || null);
        existingUser.hasIngredientsAccess = role === 'CASHIER' ? !!hasIngredientsAccess : false;
        await existingUser.save();

        await writeAuditLog({
          actor,
          action: 'USER_CREATE',
          entityId: existingUser._id,
          branchId: existingUser.branchId,
          metadata: { email, role, reactivated: true },
        });

        const userObj = existingUser.toObject();
        delete userObj.password;
        return res.status(201).json({ success: true, user: userObj });
      }
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user
    const newUser = await User.create({
      name,
      email,
      password,
      role,
      branchId: actor.role === 'ADMIN' ? actor.branchId : (branchId || null),
      hasIngredientsAccess: role === 'CASHIER' ? !!hasIngredientsAccess : false,
    });

    // Write Audit Log
    await writeAuditLog({
      actor,
      action: 'USER_CREATE',
      entityId: newUser._id,
      branchId: newUser.branchId,
      metadata: { email, role },
    });

    const userObj = newUser.toObject();
    delete userObj.password;
    return res.status(201).json({ success: true, user: userObj });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private (SUPER_ADMIN, ADMIN)
const updateUser = async (req, res) => {
  try {
    const { name, email, role, branchId, password, hasIngredientsAccess } = req.body;
    const actor = req.user;

    const userToUpdate = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Role Hierarchy Gating
    if (actor.role === 'ADMIN') {
      // Admins can only update cashiers in their own branch
      if (userToUpdate.branchId.toString() !== actor.branchId.toString()) {
        return res.status(403).json({ success: false, message: 'Cannot modify user of another branch' });
      }
      if (userToUpdate.role !== 'CASHIER') {
        return res.status(403).json({ success: false, message: 'Admins can only modify Cashier profiles' });
      }
      if (role && role !== 'CASHIER') {
        return res.status(403).json({ success: false, message: 'Admins cannot escalate user roles' });
      }
      if (branchId && branchId.toString() !== actor.branchId.toString()) {
        return res.status(403).json({ success: false, message: 'Cannot transfer user to another branch' });
      }
    } else if (actor.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const oldRole = userToUpdate.role;

    // Apply updates
    if (name) userToUpdate.name = name;
    if (email) userToUpdate.email = email;
    if (password) userToUpdate.password = password; // pre-save will hash

    // Role and branch assignment
    if (actor.role === 'SUPER_ADMIN') {
      if (role) userToUpdate.role = role;
      if (branchId !== undefined) {
        userToUpdate.branchId = role === 'SUPER_ADMIN' ? null : branchId;
      }
    }

    // Handle ingredients permission change for Cashiers
    if (hasIngredientsAccess !== undefined && userToUpdate.role === 'CASHIER') {
      const oldAccess = userToUpdate.hasIngredientsAccess;
      const newAccess = !!hasIngredientsAccess;
      if (oldAccess !== newAccess) {
        userToUpdate.hasIngredientsAccess = newAccess;
        await writeAuditLog({
          actor,
          action: 'ROLE_CHANGE',
          entityId: userToUpdate._id,
          branchId: userToUpdate.branchId,
          metadata: {
            email: userToUpdate.email,
            action: newAccess ? 'GRANT_INGREDIENTS' : 'REVOKE_INGREDIENTS',
          },
        });
      }
    }

    await userToUpdate.save();

    // Check if role changed to log ROLE_CHANGE
    if (role && oldRole !== role) {
      await writeAuditLog({
        actor,
        action: 'ROLE_CHANGE',
        entityId: userToUpdate._id,
        branchId: userToUpdate.branchId,
        metadata: { email: userToUpdate.email, oldRole, newRole: role },
      });
    }

    const userObj = userToUpdate.toObject();
    delete userObj.password;
    return res.status(200).json({ success: true, user: userObj });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Soft delete a user
// @route   DELETE /api/users/:id
// @access  Private (SUPER_ADMIN, ADMIN)
const deleteUser = async (req, res) => {
  try {
    const actor = req.user;
    const userToDelete = await User.findOne({ _id: req.params.id, isDeleted: false });

    if (!userToDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Role Hierarchy Gating
    if (actor.role === 'ADMIN') {
      if (userToDelete.branchId.toString() !== actor.branchId.toString()) {
        return res.status(403).json({ success: false, message: 'Cannot delete user of another branch' });
      }
      if (userToDelete.role !== 'CASHIER') {
        return res.status(403).json({ success: false, message: 'Admins can only delete CASHIER accounts' });
      }
    } else if (actor.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Prevent self-deletion
    if (actor._id.toString() === userToDelete._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    userToDelete.isDeleted = true;
    await userToDelete.save();

    // Log user deactivation
    await writeAuditLog({
      actor,
      action: 'ROLE_CHANGE', // Soft delete is a role access change/deactivation
      entityId: userToDelete._id,
      branchId: userToDelete.branchId,
      metadata: { email: userToDelete.email, action: 'DEACTIVATE' },
    });

    return res.status(200).json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
