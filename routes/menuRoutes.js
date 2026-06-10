const express = require('express');
const router = express.Router();
const { getMenu, addMenuItem, toggleAvailability, deleteMenuItem } = require('../controllers/menuController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMenu);
router.post('/', protect, addMenuItem);
router.patch('/:id/availability', protect, toggleAvailability);
router.delete('/:id', protect, deleteMenuItem);

module.exports = router;
