const mongoose = require('mongoose');
const { LOST_FOUND_CATEGORIES, FOUND_ITEM_STATUS } = require('../config/constants');

const foundItemSchema = new mongoose.Schema({
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
  locationFound: { 
    type: String, 
    required: [true, 'Location found is required'],
    trim: true
  },
  dateFound: { 
    type: Date, 
    required: [true, 'Date found is required'] 
  },
  images: [{ 
    type: String 
  }],
  currentCustody: { 
    type: String, 
    required: [true, 'Current custody location is required'],
    trim: true
  },
  contactInfo: { 
    type: String,
    trim: true
  },
  status: { 
    type: String, 
    enum: FOUND_ITEM_STATUS, 
    default: 'found' 
  },
  claimedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  matchedLostItem: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LostItem' 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FoundItem', foundItemSchema);