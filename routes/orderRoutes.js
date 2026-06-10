const express = require('express');
const router = express.Router();
const { createOrder, getAllOrders, getActiveOrders, completeOrder, cancelOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/', protect, getAllOrders);
router.get('/active', protect, getActiveOrders);
router.patch('/:id/complete', protect, completeOrder);
router.patch('/:id/cancel', protect, cancelOrder);

module.exports = router;
