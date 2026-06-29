const express = require('express');
const {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} = require('../controllers/ingredientController');
const { authenticate, checkIngredientsAccess } = require('../middleware/auth');
const branchScope = require('../middleware/branchScope');

const router = express.Router();

router.use(authenticate); // Must be logged in
router.use(branchScope); // Must respect branch isolation rules
router.use(checkIngredientsAccess); // Must have access permissions (SuperAdmin, Admin, or Cashier with toggle)

router.get('/', getIngredients);
router.post('/', createIngredient);
router.put('/:id', updateIngredient);
router.delete('/:id', deleteIngredient);

module.exports = router;
