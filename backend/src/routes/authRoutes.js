const express = require('express');
const { login, logout, getMe } = require('../controllers/authController');
const { authenticate, cacheControl } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, cacheControl, getMe);

module.exports = router;
