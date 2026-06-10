const MenuItem = require('../models/MenuItem');
const User = require('../models/User');

// Helper: get hotel name from logged-in owner/staff/manager
const getHotelName = async (userId) => {
  const user = await User.findById(userId).select('hotelDetails role');
  return user?.hotelDetails?.name || null;
};

// @desc  Get all menu items for the caller's hotel
// @route GET /api/menu
// @access Staff, Manager, Owner
exports.getMenu = async (req, res) => {
  try {
    const hotelName = await getHotelName(req.user.id);
    if (!hotelName) return res.status(400).json({ message: 'Hotel not found for user' });

    const items = await MenuItem.find({ hotelName }).sort({ subCategory: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Add a menu item
// @route POST /api/menu
// @access Owner only
exports.addMenuItem = async (req, res) => {
  try {
    const owner = await User.findById(req.user.id);
    if (!owner || owner.role !== 'Owner') return res.status(403).json({ message: 'Not authorized' });

    const hotelName = owner.hotelDetails?.name;
    if (!hotelName) return res.status(400).json({ message: 'Owner has no hotel' });

    const { category, subCategory, name, price } = req.body;
    const item = await MenuItem.create({ hotelName, category, subCategory, name, price });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Toggle item availability
// @route PATCH /api/menu/:id/availability
// @access Owner only
exports.toggleAvailability = async (req, res) => {
  try {
    const owner = await User.findById(req.user.id);
    if (!owner || owner.role !== 'Owner') return res.status(403).json({ message: 'Not authorized' });

    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.hotelName !== owner.hotelDetails?.name) return res.status(403).json({ message: 'Not authorized' });

    item.available = !item.available;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Delete a menu item
// @route DELETE /api/menu/:id
// @access Owner only
exports.deleteMenuItem = async (req, res) => {
  try {
    const owner = await User.findById(req.user.id);
    if (!owner || owner.role !== 'Owner') return res.status(403).json({ message: 'Not authorized' });

    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.hotelName !== owner.hotelDetails?.name) return res.status(403).json({ message: 'Not authorized' });

    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
