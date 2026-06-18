require('dotenv').config();
const mongoose = require('mongoose');
const Challenge = require('../features/gamification/challenge.model');

const challenges = [
  // Transport
  {
    title: "Car-Free Day",
    description: "Walk, bike, or take public transit for all travel today.",
    category: "transport",
    difficulty: "easy",
    durationDays: 1,
    pointsReward: 50,
    estimatedSavingKg: 5.4,
    estimatedMoneySaved: 150
  },
  {
    title: "Carpool Buddy",
    description: "Carpool with colleagues or friends for commute trips this week.",
    category: "transport",
    difficulty: "medium",
    durationDays: 5,
    pointsReward: 150,
    estimatedSavingKg: 22.0,
    estimatedMoneySaved: 600
  },
  {
    title: "Pedal Power Week",
    description: "Use a bicycle for all trips under 5km for an entire week.",
    category: "transport",
    difficulty: "hard",
    durationDays: 7,
    pointsReward: 300,
    estimatedSavingKg: 45.0,
    estimatedMoneySaved: 1200
  },
  // Energy
  {
    title: "Vampire Power Cut",
    description: "Unplug all chargers, monitors, and standby appliances before going to sleep.",
    category: "energy",
    difficulty: "easy",
    durationDays: 1,
    pointsReward: 40,
    estimatedSavingKg: 1.2,
    estimatedMoneySaved: 40
  },
  {
    title: "Thermostat Challenge",
    description: "Adjust your AC/heating by 2 degrees Celsius for a full week.",
    category: "energy",
    difficulty: "medium",
    durationDays: 7,
    pointsReward: 120,
    estimatedSavingKg: 14.5,
    estimatedMoneySaved: 350
  },
  {
    title: "Cold Wash Only",
    description: "Wash all clothes in cold water instead of hot/warm for 2 weeks.",
    category: "energy",
    difficulty: "medium",
    durationDays: 14,
    pointsReward: 180,
    estimatedSavingKg: 18.0,
    estimatedMoneySaved: 200
  },
  // Food
  {
    title: "Meatless Monday",
    description: "Eat completely plant-based (vegan/vegetarian) for a full day.",
    category: "food",
    difficulty: "easy",
    durationDays: 1,
    pointsReward: 50,
    estimatedSavingKg: 4.8,
    estimatedMoneySaved: 100
  },
  {
    title: "Local Produce Only",
    description: "Source all meals using only locally grown ingredients for 3 days.",
    category: "food",
    difficulty: "medium",
    durationDays: 3,
    pointsReward: 100,
    estimatedSavingKg: 8.5,
    estimatedMoneySaved: 50
  },
  {
    title: "Zero Waste Week",
    description: "Plan meals and freeze leftovers to ensure zero food waste for 7 days.",
    category: "food",
    difficulty: "hard",
    durationDays: 7,
    pointsReward: 250,
    estimatedSavingKg: 15.0,
    estimatedMoneySaved: 800
  },
  // Digital
  {
    title: "Digital Detox",
    description: "No recreational screen time (streaming, gaming, social media) for 4 hours.",
    category: "digital",
    difficulty: "easy",
    durationDays: 1,
    pointsReward: 30,
    estimatedSavingKg: 0.8,
    estimatedMoneySaved: 0
  },
  {
    title: "Email Inbox Cleanout",
    description: "Delete 500 old/unwanted emails and unsubscribe from unused newsletters.",
    category: "digital",
    difficulty: "medium",
    durationDays: 2,
    pointsReward: 80,
    estimatedSavingKg: 2.0,
    estimatedMoneySaved: 0
  },
  {
    title: "Analog Weekend",
    description: "Spend 24 continuous hours completely offline (except emergency communications).",
    category: "digital",
    difficulty: "hard",
    durationDays: 2,
    pointsReward: 350,
    estimatedSavingKg: 12.0,
    estimatedMoneySaved: 100
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecowise');
    console.log("Connected to database for seeding.");

    await Challenge.deleteMany({});
    console.log("Cleared challenges database.");

    await Challenge.insertMany(challenges);
    console.log("Successfully seeded 12 gamified challenges.");

    mongoose.connection.close();
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedDB();
