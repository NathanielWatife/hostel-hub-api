const express = require('express');
const { register, login, getMe, updateProfile, bootstrapAdmin } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/bootstrap-admin', bootstrapAdmin);

// Protected routes
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);

module.exports = router;