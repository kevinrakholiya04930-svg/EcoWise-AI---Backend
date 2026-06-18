const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['transport', 'energy', 'food', 'digital'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  durationDays: { type: Number, required: true },
  pointsReward: { type: Number, required: true },
  estimatedSavingKg: { type: Number, required: true },
  estimatedMoneySaved: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Challenge', challengeSchema);
