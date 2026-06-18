const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  city: { type: String, default: '' },
  transportation: {
    mode: { type: String, enum: ['car', 'bike', 'public', 'walking', 'wfh'], default: 'walking' },
    dailyDistanceKm: { type: Number, default: 0 }
  },
  electricity: {
    monthlyUsage: { type: Number, default: 0 }
  },
  lifestyle: {
    dietType: { type: String, enum: ['vegan', 'vegetarian', 'omnivore', 'meat-heavy'], default: 'vegetarian' },
    screenTime: { type: Number, default: 0 }
  },
  sustainabilityGoal: { type: String, enum: ['reduce25', 'reduce50', 'offset', 'awareness'], default: 'awareness' },
  onboardingCompleted: { type: Boolean, default: false },

  // Legacy flat fields kept so existing onboarding, dashboard, and carbon logic continue to work.
  country: { type: String, default: '' },
  transportMode: { type: String, enum: ['car', 'bike', 'public', 'walking', 'wfh'], default: 'walking' },
  dailyTravelKm: { type: Number, default: 0 },
  monthlyElectricityKwh: { type: Number, default: 0 },
  dietType: { type: String, enum: ['vegan', 'vegetarian', 'omnivore', 'meat-heavy'], default: 'vegetarian' },
  dailyDigitalHours: { type: Number, default: 0 },
  workStyle: { type: String, enum: ['office', 'remote', 'hybrid'], default: 'office' },
  householdSize: { type: Number, default: 1 },
  goalType: { type: String, enum: ['reduce25', 'reduce50', 'offset', 'awareness'], default: 'awareness' }
}, { _id: false });

const badgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now }
}, { _id: false });

const activeChallengeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  startedAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  profile: { type: profileSchema, default: () => ({}) },
  persona: { type: String, default: 'The Green Sprout' },
  gamification: {
    greenPoints: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    earnedBadges: { type: [badgeSchema], default: [] },
    activeChallenges: { type: [activeChallengeSchema], default: [] }
  },
  onboardingCompleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
