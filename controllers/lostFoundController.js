const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');

// @desc    Get all lost items
// @route   GET /api/lost-found/lost
// @access  Private
exports.getLostItems = async (req, res) => {
  try {
    const { status, category, limit = 50 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const lostItems = await LostItem.find(filter)
      .populate('userId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: lostItems
    });
  } catch (error) {
    console.error('Get lost items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lost items'
    });
  }
};

// @desc    Get all found items
// @route   GET /api/lost-found/found
// @access  Private
exports.getFoundItems = async (req, res) => {
  try {
    const { status, category, limit = 50 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const foundItems = await FoundItem.find(filter)
      .populate('userId', 'fullName')
      .populate('claimedBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: foundItems
    });
  } catch (error) {
    console.error('Get found items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching found items'
    });
  }
};

// @desc    Report lost item
// @route   POST /api/lost-found/lost
// @access  Private
exports.reportLost = async (req, res) => {
  try {
    const {
      category,
      itemName,
      description,
      brand,
      color,
      locationLost,
      dateLost,
      identifyingFeatures
    } = req.body;

    const lostItem = await LostItem.create({
      userId: req.user._id,
      category,
      itemName,
      description,
      brand,
      color,
      locationLost,
      dateLost,
      identifyingFeatures
    });

    await lostItem.populate('userId', 'fullName');

    res.status(201).json({
      success: true,
      data: lostItem
    });
  } catch (error) {
    console.error('Report lost item error:', error);
    
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
      message: 'Server error while reporting lost item'
    });
  }
};

// @desc    Report found item
// @route   POST /api/lost-found/found
// @access  Private
exports.reportFound = async (req, res) => {
  try {
    const {
      category,
      itemName,
      description,
      brand,
      color,
      locationFound,
      dateFound,
      currentCustody,
      contactInfo
    } = req.body;

    const foundItem = await FoundItem.create({
      userId: req.user._id,
      category,
      itemName,
      description,
      brand,
      color,
      locationFound,
      dateFound,
      currentCustody,
      contactInfo
    });

    await foundItem.populate('userId', 'fullName');

    res.status(201).json({
      success: true,
      data: foundItem
    });
  } catch (error) {
    console.error('Report found item error:', error);
    
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
      message: 'Server error while reporting found item'
    });
  }
};

// @desc    Claim found item
// @route   PUT /api/lost-found/found/:id/claim
// @access  Private
exports.claimItem = async (req, res) => {
  try {
    const foundItem = await FoundItem.findById(req.params.id);

    if (!foundItem) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found'
      });
    }

    if (foundItem.status !== 'found') {
      return res.status(400).json({
        success: false,
        message: 'Item is not available for claiming'
      });
    }

    // Update the found item status
    foundItem.status = 'claimed';
    foundItem.claimedBy = req.user._id;
    await foundItem.save();

    await foundItem.populate('userId', 'fullName');
    await foundItem.populate('claimedBy', 'fullName');

    res.json({
      success: true,
      message: 'Item claimed successfully',
      data: foundItem
    });
  } catch (error) {
    console.error('Claim item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while claiming item'
    });
  }
};

// @desc    Get matching suggestions
// @route   GET /api/lost-found/matches
// @access  Private
exports.getMatches = async (req, res) => {
  try {
    // Simple matching based on category and item name similarity
    const lostItems = await LostItem.find({ status: 'lost' })
      .populate('userId', 'fullName');
    
    const foundItems = await FoundItem.find({ status: 'found' })
      .populate('userId', 'fullName');

    const matches = [];

    // Basic matching logic (you can enhance this)
    lostItems.forEach(lostItem => {
      foundItems.forEach(foundItem => {
        if (lostItem.category === foundItem.category) {
          const lostName = lostItem.itemName.toLowerCase();
          const foundName = foundItem.itemName.toLowerCase();
          
          // Simple similarity check
          if (lostName.includes(foundName) || foundName.includes(lostName)) {
            matches.push({
              lostItem,
              foundItem,
              confidence: 0.7 // Basic confidence score
            });
          }
        }
      });
    });

    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while finding matches'
    });
  }
};

// @desc    Get user's lost/found items
// @route   GET /api/lost-found/user/my-items
// @access  Private
exports.getMyItems = async (req, res) => {
  try {
    const lostItems = await LostItem.find({ userId: req.user._id })
      .populate('userId', 'fullName')
      .sort({ createdAt: -1 });

    const foundItems = await FoundItem.find({ userId: req.user._id })
      .populate('userId', 'fullName')
      .populate('claimedBy', 'fullName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        lostItems,
        foundItems
      }
    });
  } catch (error) {
    console.error('Get my items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user items'
    });
  }
};