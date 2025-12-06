const mongoose = require('mongoose');
const { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES, COMPLAINT_STATUS } = require('../config/constants');

const complaintSchema = new mongoose.Schema({
  ticketNumber: { 
    type: String, 
    unique: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  category: { 
    type: String, 
    required: true, 
    enum: COMPLAINT_CATEGORIES 
  },
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    trim: true,
    maxlength: 1000
  },
  location: {
    block: { 
      type: String, 
      required: [true, 'Block is required'],
      trim: true,
      uppercase: true
    },
    floor: { 
      type: String, 
      required: [true, 'Floor is required'] 
    },
    roomNumber: { 
      type: String, 
      required: [true, 'Room number is required'] 
    }
  },
  priority: { 
    type: String, 
    enum: COMPLAINT_PRIORITIES, 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: COMPLAINT_STATUS, 
    default: 'submitted' 
  },
  images: [{ 
    type: String 
  }],
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  anonymous: { 
    type: Boolean, 
    default: false 
  },
  comments: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    message: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 500
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }]
}, {
  timestamps: true
});

// Generate ticket number before saving (using timestamp + random to avoid race conditions)
complaintSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Use timestamp + random suffix to ensure uniqueness in high concurrency
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const prefix = 'HOSTEL';
    const year = new Date().getFullYear();
    this.ticketNumber = `${prefix}-${year}-${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);