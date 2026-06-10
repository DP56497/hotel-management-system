const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
exports.signup = async (req, res) => {
  const { fullName, email, password, role, hotelDetails } = req.body;
  
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role,
      hotelDetails,
      status: role === 'Owner' ? 'Approved' : 'Pending'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        hotelDetails: user.hotelDetails,
        status: user.status,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        hotelDetails: user.hotelDetails,
        status: user.status,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile (via token)
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all existing hotels listed by Owners
// @route   GET /api/auth/hotels
exports.getAllHotels = async (req, res) => {
  try {
    const owners = await User.find({ role: 'Owner' }).select('hotelDetails');
    const hotels = owners.map(o => o.hotelDetails).filter(h => h && h.name);
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get staff & managers for specific hotel
// @route   GET /api/auth/staff
exports.getHotelStaff = async (req, res) => {
  try {
    const owner = await User.findById(req.user.id);
    if (!owner || owner.role !== 'Owner') return res.status(403).json({message: 'Not authorized'});
    
    const staff = await User.find({ 
      role: { $in: ['Manager', 'Staff'] },
      'hotelDetails.name': owner.hotelDetails.name
    }).select('-password');
    
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Approve staff
// @route   PUT /api/auth/staff/:id/approve
exports.approveStaff = async (req, res) => {
  try {
    const owner = await User.findById(req.user.id);
    if (!owner || owner.role !== 'Owner') return res.status(403).json({message: 'Not authorized'});

    const staffMember = await User.findById(req.params.id);
    if (!staffMember) return res.status(404).json({message: 'User not found'});

    staffMember.status = 'Approved';
    await staffMember.save();

    res.json(staffMember);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reject staff/manager account
// @route   PUT /api/auth/staff/:id/reject
exports.rejectStaff = async (req, res) => {
  try {
    const owner = await User.findById(req.user.id);
    if (!owner || owner.role !== 'Owner') return res.status(403).json({ message: 'Not authorized' });

    const staffMember = await User.findById(req.params.id);
    if (!staffMember) return res.status(404).json({ message: 'User not found' });

    staffMember.status = 'Rejected';
    await staffMember.save();

    res.json(staffMember);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
