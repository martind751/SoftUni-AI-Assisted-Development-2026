const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    targetDate: { type: Date }
  },
  { timestamps: true }
);

const Goal = mongoose.model('Goal', goalSchema);

module.exports = { Goal };
