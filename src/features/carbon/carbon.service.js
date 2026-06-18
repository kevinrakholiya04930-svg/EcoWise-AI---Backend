const CarbonEntry = require('./carbon.model');
const User = require('../user/user.model');
const { calculateEmissions, getPersona } = require('./carbon.calculator');

const logWeeklyEntry = async (userId, data) => {
  const { week, profile } = data;
  
  if (!week || !profile) {
    throw new Error('Week and profile variables are required');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Calculate emissions
  const calculated = calculateEmissions(profile);
  const persona = getPersona(calculated);

  // Check if entry already exists for this week
  let entry = await CarbonEntry.findOne({ userId, week });
  const isNewEntry = !entry;

  if (entry) {
    entry.emissions = {
      transportation: calculated.transportation,
      electricity: calculated.electricity,
      food: calculated.food,
      digital: calculated.digital,
      total: calculated.total
    };
    entry.carbonScore = calculated.score;
    entry.treesRequired = calculated.treesRequired;
    entry.persona = persona;
    await entry.save();
  } else {
    entry = await CarbonEntry.create({
      userId,
      week,
      emissions: {
        transportation: calculated.transportation,
        electricity: calculated.electricity,
        food: calculated.food,
        digital: calculated.digital,
        total: calculated.total
      },
      carbonScore: calculated.score,
      treesRequired: calculated.treesRequired,
      persona
    });
  }

  // Award points & update streaks if it's a new week log
  if (isNewEntry) {
    // 1. Award 10 base points
    user.gamification.greenPoints += 10;

    // 2. Check reduction vs last week
    // Parse week string to find previous week (e.g. "2026-W25" -> prev should be "2026-W24")
    const prevWeek = getPreviousWeekStr(week);
    const lastEntry = await CarbonEntry.findOne({ userId, week: prevWeek });
    
    if (lastEntry && calculated.total < lastEntry.emissions.total) {
      user.gamification.greenPoints += 100; // Award 100 pts for reduction
    }

    // 3. Update Streak
    // Check if user has active streak
    const mostRecentEntryBeforeThis = await CarbonEntry.findOne({ 
      userId, 
      week: { $ne: week } 
    }).sort({ week: -1 });

    if (mostRecentEntryBeforeThis) {
      if (mostRecentEntryBeforeThis.week === prevWeek) {
        user.gamification.currentStreak += 1;
      } else {
        user.gamification.currentStreak = 1;
      }
    } else {
      user.gamification.currentStreak = 1;
    }

    if (user.gamification.currentStreak > user.gamification.longestStreak) {
      user.gamification.longestStreak = user.gamification.currentStreak;
    }
    user.gamification.lastActiveDate = new Date();

    // Check level thresholds
    // Level 1: 0, Level 2: 500, Level 3: 1500, Level 4: 3000, Level 5: 6000, Level 6: 10000
    const points = user.gamification.greenPoints;
    let newLevel = 1;
    if (points >= 10000) newLevel = 6;
    else if (points >= 6000) newLevel = 5;
    else if (points >= 3000) newLevel = 4;
    else if (points >= 1500) newLevel = 3;
    else if (points >= 500) newLevel = 2;

    user.gamification.level = newLevel;

    // Award badges based on badges logic
    const hasBadge = (badgeId) => user.gamification.earnedBadges.some(b => b.id === badgeId);
    
    if (!hasBadge('data-driven')) {
      user.gamification.earnedBadges.push({ id: 'data-driven', earnedAt: new Date() });
    }
    if (user.gamification.currentStreak >= 7 && !hasBadge('week-warrior')) {
      user.gamification.earnedBadges.push({ id: 'week-warrior', earnedAt: new Date() });
    }
    if (user.gamification.currentStreak >= 30 && !hasBadge('month-master')) {
      user.gamification.earnedBadges.push({ id: 'month-master', earnedAt: new Date() });
    }

    await user.save();
  }

  return {
    entry,
    greenPoints: user.gamification.greenPoints,
    level: user.gamification.level,
    currentStreak: user.gamification.currentStreak
  };
};

const getHistory = async (userId) => {
  return await CarbonEntry.find({ userId }).sort({ week: 1 }).limit(12);
};

const getSummary = async (userId) => {
  // Get latest entry
  const latest = await CarbonEntry.findOne({ userId }).sort({ week: -1 });
  if (!latest) {
    // Return baseline calculated from profile
    const user = await User.findById(userId);
    if (!user || !user.onboardingCompleted) {
      return null;
    }
    const baseline = calculateEmissions(user.profile);
    return {
      emissions: baseline,
      carbonScore: baseline.score,
      treesRequired: baseline.treesRequired,
      persona: user.persona,
      week: 'Baseline'
    };
  }
  return latest;
};

const getProjection = async (userId) => {
  const history = await CarbonEntry.find({ userId }).sort({ week: 1 });
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  const baseline = calculateEmissions(user.profile);
  let latestTotal = baseline.total;
  let dataPoints = [];

  if (history.length > 0) {
    dataPoints = history.map((entry, idx) => ({ x: idx, y: entry.emissions.total }));
    latestTotal = history[history.length - 1].emissions.total;
  } else {
    // Make fake history for regression if empty
    dataPoints = [
      { x: 0, y: baseline.total * 1.1 },
      { x: 1, y: baseline.total * 1.05 },
      { x: 2, y: baseline.total }
    ];
  }

  // Linear regression y = mx + c
  const n = dataPoints.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let pt of dataPoints) {
    sumX += pt.x;
    sumY += pt.y;
    sumXY += pt.x * pt.y;
    sumXX += pt.x * pt.x;
  }

  let slope = 0;
  let intercept = latestTotal;

  if (n > 1) {
    const denominator = (n * sumXX - sumX * sumX);
    if (denominator !== 0) {
      slope = (n * sumXY - sumX * sumY) / denominator;
      intercept = (sumY - slope * sumX) / n;
    }
  }

  // Generate 12-week projections
  const currentTrajectory = [];
  const goalTrajectory = [];
  const optimisticTrajectory = [];

  const goalMultiplier = user.profile.goalType === 'reduce50' ? 0.5 : 0.75; // 50% or 25% reduction target

  const startIdx = history.length > 0 ? history.length - 1 : 2;

  for (let i = 1; i <= 12; i++) {
    const weekIdx = startIdx + i;
    
    // Trajectory projected by regression
    let projVal = slope * weekIdx + intercept;
    if (projVal < 20) projVal = 20; // Lower physical limit
    currentTrajectory.push(Math.round(projVal));

    // Goal trajectory (exponential decay towards goal)
    const goalVal = latestTotal - ((latestTotal * (1 - goalMultiplier)) * (i / 12));
    goalTrajectory.push(Math.round(Math.max(20, goalVal)));

    // Optimistic trajectory (rapid drops)
    const optVal = latestTotal * Math.pow(0.93, i);
    optimisticTrajectory.push(Math.round(Math.max(20, optVal)));
  }

  return {
    currentTrajectory,
    goalTrajectory,
    optimisticTrajectory,
    labels: Array.from({ length: 12 }, (_, i) => `Week ${i + 1}`)
  };
};

// Helper to calculate previous week string
function getPreviousWeekStr(weekStr) {
  // weekStr = "YYYY-Www"
  const parts = weekStr.split('-W');
  const year = parseInt(parts[0]);
  const week = parseInt(parts[1]);
  
  if (week === 1) {
    return `${year - 1}-W52`;
  }
  const prevWeek = week - 1;
  return `${year}-W${prevWeek < 10 ? '0' + prevWeek : prevWeek}`;
}

module.exports = {
  logWeeklyEntry,
  getHistory,
  getSummary,
  getProjection
};
