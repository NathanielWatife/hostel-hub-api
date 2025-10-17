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

// Generate ticket number before saving
complaintSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    const prefix = 'HOSTEL';
    const year = new Date().getFullYear();
    const sequential = (count + 1).toString().padStart(4, '0');
    this.ticketNumber = `${prefix}-${year}-${sequential}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);