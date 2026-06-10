const express = require('express');
const router = express.Router();
const { signup, login, getMe, getAllHotels, getHotelStaff, approveStaff, rejectStaff } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/hotels', getAllHotels);
router.get('/staff', protect, getHotelStaff);
router.put('/staff/:id/approve', protect, approveStaff);
router.put('/staff/:id/reject', protect, rejectStaff);

module.exports = router;
