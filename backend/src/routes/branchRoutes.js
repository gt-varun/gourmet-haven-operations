const express = require('express');
const {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} = require('../controllers/branchController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate); // All routes require authentication

router.get('/', getBranches);
router.post('/', authorize('SUPER_ADMIN'), createBranch);
router.put('/:id', authorize('SUPER_ADMIN'), updateBranch);
router.delete('/:id', authorize('SUPER_ADMIN'), deleteBranch);

module.exports = router;
