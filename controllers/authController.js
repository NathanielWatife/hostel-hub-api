const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    
    const { matricNo, email, password, fullName, hostelBlock, roomNumber, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ matricNo }, { email }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this university ID or email'
      });
    }

    // Create user
    const user = await User.create({
      matricNo: matricNo.toUpperCase(),
      email: email.toLowerCase(),
      password,
      fullName,
      hostelBlock: hostelBlock.toUpperCase(),
      roomNumber,
      phone
    });

    console.log('User created successfully:', user._id);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: messages
      });
    }

    // Duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `User already exists with this ${field}`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { matricNo, email, identifier, password } = req.body;

    // Validate input
    if (!password || (!matricNo && !email && !identifier)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/matric and password'
      });
    }

    // Determine lookup field: prioritize identifier, then email, then matricNo
    let query = { isActive: true };
    if (identifier) {
      // Simple heuristic: contains @ means email, else matric
      if (identifier.includes('@')) {
        query.email = identifier.toLowerCase();
      } else {
        query.matricNo = identifier.toUpperCase();
      }
    } else if (email) {
      query.email = email.toLowerCase();
    } else if (matricNo) {
      query.matricNo = matricNo.toUpperCase();
    }

    // Check if user exists and is active
    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, email, phone, hostelBlock, roomNumber } = req.body;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already taken'
        });
      }
    }

    const updateData = {
      fullName,
      phone,
      hostelBlock: hostelBlock.toUpperCase(),
      roomNumber
    };

    if (email) {
      updateData.email = email.toLowerCase();
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: messages
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already taken'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
};

// @desc    Bootstrap: create the first admin (HTTP alternative to CLI)
// @route   POST /api/auth/bootstrap-admin
// @access  Protected by env flag; only when no admin exists
exports.bootstrapAdmin = async (req, res) => {
  try {
    // Guard with environment flag to disable in production by default
    if (process.env.ENABLE_ADMIN_BOOTSTRAP !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Admin bootstrap is disabled'
      });
    }

    // Ensure no admin exists yet (one-time bootstrap)
    const adminExists = await User.exists({ role: 'admin' });
    if (adminExists) {
      return res.status(409).json({
        success: false,
        message: 'Admin already exists. Bootstrap not allowed.'
      });
    }

    const { email, fullName, password } = req.body || {};

    if (!email || !fullName || !password) {
      return res.status(400).json({
        success: false,
        message: 'email, fullName and password are required'
      });
    }

    // If a user with this email exists (e.g., pre-registered student), promote to admin
    let user = await User.findOne({ email: String(email).toLowerCase() });

    if (user) {
      user.role = 'admin';
      user.fullName = fullName; // allow updating display name during bootstrap
      user.password = password; // will be hashed by pre-save hook
      await user.save();
    } else {
      user = await User.create({
        email: String(email).toLowerCase(),
        fullName,
        password,
        role: 'admin'
      });
    }

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Admin account bootstrapped successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Bootstrap admin error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: messages
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Duplicate ${field}`
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error during admin bootstrap'
    });
  }
};