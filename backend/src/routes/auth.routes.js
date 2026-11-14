const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (cần Bearer Token)
router.get('/me', authenticate, authController.getMe);

module.exports = router;
