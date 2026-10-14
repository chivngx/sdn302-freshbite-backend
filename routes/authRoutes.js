const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword
} = require('../middlewares/validators/authValidator');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, validateUpdateProfile, updateProfile);
router.put('/change-password', verifyToken, validateChangePassword, changePassword);

module.exports = router;