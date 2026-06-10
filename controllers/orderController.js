const Order = require('../models/Order');
const User = require('../models/User');

// @desc  Create a new order
// @route POST /api/orders
// @access Staff
exports.createOrder = async (req, res) => {
  try {
    const staff = await User.findById(req.user.id);
    if (!staff) return res.status(403).json({ message: 'Not authorized' });

    const hotelName = staff.hotelDetails?.name;
    if (!hotelName) return res.status(400).json({ message: 'Hotel not found' });

    const { tableNumber, customerName, customerMobile, items } = req.body;

    // Check if there's already an active order for this table and customer
    let order = await Order.findOne({
      hotelName,
      tableNumber,
      customerMobile,
      status: 'Active'
    });

    if (order) {
      // Merge items into existing order
      items.forEach(newItem => {
        const existingItem = order.items.find(i => 
          (i.menuItemId && newItem.menuItemId && i.menuItemId.toString() === newItem.menuItemId.toString()) ||
          (i.name === newItem.name)
        );
        if (existingItem) {
          existingItem.qty += newItem.qty;
        } else {
          order.items.push(newItem);
        }
      });
      order.totalAmount = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
      await order.save();
      return res.json(order);
    }

    // Otherwise create new order
    const totalAmount = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    order = await Order.create({
      hotelName,
      tableNumber,
      customerName,
      customerMobile,
      items,
      totalAmount,
      createdBy: staff._id,
      staffName: staff.fullName
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Get all orders for a hotel (Owner & Manager)
// @route GET /api/orders
// @access Owner, Manager
exports.getAllOrders = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !['Owner', 'Manager'].includes(user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const hotelName = user.hotelDetails?.name;
    if (!hotelName) return res.status(400).json({ message: 'Hotel not found' });

    const orders = await Order.find({ hotelName }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Get active orders for staff (their own hotel, active)
// @route GET /api/orders/active
// @access Staff
exports.getActiveOrders = async (req, res) => {
  try {
    const staff = await User.findById(req.user.id);
    if (!staff) return res.status(403).json({ message: 'Not authorized' });

    const hotelName = staff.hotelDetails?.name;
    const orders = await Order.find({ hotelName, status: 'Active' }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Complete an order
// @route PATCH /api/orders/:id/complete
// @access Staff
exports.completeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = 'Completed';
    order.billGenerated = true;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Cancel an order
// @route PATCH /api/orders/:id/cancel
// @access Staff
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = 'Cancelled';
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
