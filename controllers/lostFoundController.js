const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');

// @desc    Get all lost items
// @route   GET /api/lost-found/lost
// @access  Private
const getLostItems = async (req, res) => {
  try {
    const { status, category, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const lostItems = await LostItem.find(filter)
      .populate('userId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      lostItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lost items',
      error: error.message
    });
  }
};

// @desc    Get all found items
// @route   GET /api/lost-found/found
// @access  Private
const getFoundItems = async (req, res) => {
  try {
    const { status, category, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const foundItems = await FoundItem.find(filter)
      .populate('userId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      foundItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching found items',
      error: error.message
    });
  }
};

// @desc    Report lost item
// @route   POST /api/lost-found/lost
// @access  Private
const reportLostItem = async (req, res) => {
  try {
    const lostItem = await LostItem.create({
      userId: req.user._id,
      ...req.body,
      images: req.files ? req.files.map(file => file.path) : []
    });

    await lostItem.populate('userId', 'fullName');

    res.status(201).json({
      success: true,
      lostItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reporting lost item',
      error: error.message
    });
  }
};

// @desc    Report found item
// @route   POST /api/lost-found/found
// @access  Private
const reportFoundItem = async (req, res) => {
  try {
    const foundItem = await FoundItem.create({
      userId: req.user._id,
      ...req.body,
      images: req.files ? req.files.map(file => file.path) : []
    });

    await foundItem.populate('userId', 'fullName');

    res.status(201).json({
      success: true,
      foundItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reporting found item',
      error: error.message
    });
  }
};

// @desc    Claim found item
// @route   PUT /api/lost-found/found/:id/claim
// @access  Private
const claimFoundItem = async (req, res) => {
  try {
    const { proofOfOwnership, additionalDetails } = req.body;

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

    foundItem.status = 'claimed';
    foundItem.claimedBy = req.user._id;
    await foundItem.save();

    await foundItem.populate('userId', 'fullName');
    await foundItem.populate('claimedBy', 'fullName matricNo');

    res.json({
      success: true,
      message: 'Item claimed successfully',
      foundItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error claiming item',
      error: error.message
    });
  }
};

// @desc    Get matching suggestions
// @route   GET /api/lost-found/matches
// @access  Private
const getMatches = async (req, res) => {
  try {
    // Simple matching based on category and item name
    const lostItems = await LostItem.find({ status: 'lost' });
    const foundItems = await FoundItem.find({ status: 'found' });

    const matches = [];

    for (const lostItem of lostItems) {
      for (const foundItem of foundItems) {
        if (lostItem.category === foundItem.category) {
          const nameSimilarity = calculateSimilarity(
            lostItem.itemName.toLowerCase(),
            foundItem.itemName.toLowerCase()
          );

          if (nameSimilarity > 0.6) { // 60% similarity threshold
            matches.push({
              lostItem,
              foundItem,
              confidence: nameSimilarity
            });
          }
        }
      }
    }

    res.json({
      success: true,
      matches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error finding matches',
      error: error.message
    });
  }
};

// Helper function for string similarity
function calculateSimilarity(str1, str2) {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

module.exports = {
  getLostItems,
  getFoundItems,
  reportLostItem,
  reportFoundItem,
  claimFoundItem,
  getMatches
};