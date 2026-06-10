const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  hotelName: { type: String, required: true },
  category: { type: String, enum: ['Food', 'Drink'], required: true },
  subCategory: {
    type: String,
    enum: ['Gujarati', 'Punjabi', 'Chinese', 'South Indian', 'Drinks'],
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
