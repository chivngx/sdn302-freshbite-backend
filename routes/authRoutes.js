const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getFavorites,
  addFavorite,
  removeFavorite
} = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateFavorite
} = require('../middlewares/validators/authValidator');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, validateUpdateProfile, updateProfile);
router.put('/change-password', verifyToken, validateChangePassword, changePassword);

// favorites routes (mon an yeu thich cua khach hang)
router.get('/favorites', verifyToken, getFavorites);
router.post('/favorites/:productId?', verifyToken, validateFavorite, addFavorite);
router.delete('/favorites/:productId?', verifyToken, validateFavorite, removeFavorite);

module.exports = router;
