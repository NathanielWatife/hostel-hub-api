const mongoose = require('mongoose');
const { LOST_FOUND_CATEGORIES, LOST_ITEM_STATUS } = require('../config/constants');

const lostItemSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  category: { 
    type: String, 
    required: true, 
    enum: LOST_FOUND_CATEGORIES 
  },
  itemName: { 
    type: String, 
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    trim: true,
    maxlength: 500
  },
  brand: { 
    type: String,
    trim: true
  },
  color: { 
    type: String,
    trim: true
  },
  locationLost: { 
    type: String, 
    required: [true, 'Location lost is required'],
    trim: true
  },
  dateLost: { 
    type: Date, 
    required: [true, 'Date lost is required'] 
  },
  images: [{ 
    type: String 
  }],
  status: { 
    type: String, 
    enum: LOST_ITEM_STATUS, 
    default: 'lost' 
  },
  matchedFoundItem: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'FoundItem' 
  },
  identifyingFeatures: { 
    type: String,
    trim: true,
    maxlength: 200
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LostItem', lostItemSchema);