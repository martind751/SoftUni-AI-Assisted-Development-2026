const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#6b7280' } // gray-500 default
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', categorySchema);

module.exports = { Category };
