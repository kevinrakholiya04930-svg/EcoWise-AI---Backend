const mongoose = require('mongoose');

const carbonEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  week: { type: String, required: true, index: true }, // "YYYY-Www" format
  emissions: {
    transportation: { type: Number, required: true },
    electricity: { type: Number, required: true },
    food: { type: Number, required: true },
    digital: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  carbonScore: { type: Number, required: true },
  treesRequired: { type: Number, required: true },
  persona: { type: String, required: true },
}, { timestamps: true });

// Prevent duplicate entries for the same user and week
carbonEntrySchema.index({ userId: 1, week: 1 }, { unique: true });

module.exports = mongoose.model('CarbonEntry', carbonEntrySchema);
