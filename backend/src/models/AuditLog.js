const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorEmail: {
      type: String,
      required: true,
      trim: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null, // Null for global superadmin actions
    },
    action: {
      type: String,
      required: true,
      enum: [
        'USER_CREATE',
        'ROLE_CHANGE',
        'ORDER_VOID',
        'INVENTORY_RESTOCK',
        'DISCOUNT_OVERRIDE',
      ],
    },
    entityType: {
      type: String,
      required: true, // e.g. 'User', 'Product', 'Order'
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need creation time
  }
);

// Indexes to speed up log querying
auditLogSchema.index({ branchId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
