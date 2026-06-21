const mongoose = require('mongoose');

const carbonEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    week: {
      type: String,
      required: true,
      index: true, // YYYY-Www
    },

    emissions: {
      transportation: {
        type: Number,
        required: true,
        min: 0,
      },

      electricity: {
        type: Number,
        required: true,
        min: 0,
      },

      food: {
        type: Number,
        required: true,
        min: 0,
      },

      digital: {
        type: Number,
        required: true,
        min: 0,
      },

      total: {
        type: Number,
        required: true,
        min: 0,
      },
    },

    carbonScore: {
      type: Number,
      required: true,
      min: 0,
    },

    treesRequired: {
      type: Number,
      required: true,
      min: 0,
    },

    persona: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate entries for same week
carbonEntrySchema.index(
  { userId: 1, week: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'CarbonEntry',
  carbonEntrySchema
);