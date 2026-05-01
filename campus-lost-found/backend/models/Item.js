const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  item_name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  contact: {
    type: String,
    required: [true, 'Contact info is required'],
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Date is required']
  },
  type: {
    type: String,
    enum: ['lost', 'found'],
    required: [true, 'Type (lost/found) is required']
  },
  status: {
    type: String,
    enum: ['active', 'returned'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Item', itemSchema);
