const Complaint = require('../models/Complaint');

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private
exports.getAllComplaints = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    // If user is not admin, only show their complaints
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      filter.userId = req.user._id;
    }

    const complaints = await Complaint.find(filter)
      .populate('userId', 'fullName matricNo')
      .populate('assignedTo', 'fullName')
      .populate('comments.user', 'fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Complaint.countDocuments(filter);

    res.json({
      success: true,
      data: complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching complaints'
    });
  }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
exports.getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'fullName matricNo')
      .populate('assignedTo', 'fullName')
      .populate('comments.user', 'fullName');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if user has access to this complaint
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        complaint.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this complaint'
      });
    }

    res.json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching complaint'
    });
  }
};

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private
exports.createComplaint = async (req, res) => {
  try {
    const { category, title, description, location, priority, anonymous } = req.body;

    const complaint = await Complaint.create({
      userId: req.user._id,
      category,
      title,
      description,
      location,
      priority,
      anonymous
    });

    // Populate the user data for response
    await complaint.populate('userId', 'fullName matricNo');

    res.status(201).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating complaint'
    });
  }
};

// @desc    Update complaint
// @route   PUT /api/complaints/:id
// @access  Private
exports.updateComplaint = async (req, res) => {
  try {
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if user has permission to update
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        complaint.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to update this complaint'
      });
    }

    // Define allowed fields for update based on user role
    const allowedFields = ['title', 'description', 'priority'];
    if (req.user.role === 'admin' || req.user.role === 'staff') {
      allowedFields.push('status', 'assignedTo', 'category');
    }

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'fullName matricNo')
     .populate('assignedTo', 'fullName')
     .populate('comments.user', 'fullName');

    res.json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating complaint'
    });
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private/Admin/Staff
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('userId', 'fullName matricNo')
     .populate('assignedTo', 'fullName')
     .populate('comments.user', 'fullName');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error('Update status error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating status'
    });
  }
};

// @desc    Add comment to complaint
// @route   POST /api/complaints/:id/comment
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { message } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if user has access to this complaint
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        complaint.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this complaint'
      });
    }

    const comment = {
      user: req.user._id,
      message
    };

    complaint.comments.push(comment);
    await complaint.save();

    // Populate the new comment's user data
    await complaint.populate('comments.user', 'fullName');

    const newComment = complaint.comments[complaint.comments.length - 1];

    res.status(201).json({
      success: true,
      data: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
};

// @desc    Get user's complaints
// @route   GET /api/complaints/user/my-complaints
// @access  Private
exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id })
      .populate('userId', 'fullName matricNo')
      .populate('assignedTo', 'fullName')
      .populate('comments.user', 'fullName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: complaints
    });
  } catch (error) {
    console.error('Get my complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching complaints'
    });
  }
};