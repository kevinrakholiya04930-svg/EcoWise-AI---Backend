const CarbonEntry = require('./carbon.model');
const User = require('../user/user.model');
const {
  calculateEmissions,
  getPersona
} = require('./carbon.calculator');

const logWeeklyEntry = async (userId, data) => {
  const { week, profile } = data;

  if (!week || !profile) {
    throw new Error('Week and profile variables are required');
  }

  // Need mongoose document because we save later
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Calculate emissions
  const calculated = calculateEmissions(profile);
  const persona = getPersona(calculated);

  // Check if entry exists
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

  // Gamification logic
  if (isNewEntry) {
    // Base points
    user.gamification.greenPoints += 10;

    const prevWeek = getPreviousWeekStr(week);

    const [lastEntry, mostRecentEntryBeforeThis] = await Promise.all([
      CarbonEntry.findOne({ userId, week: prevWeek }).lean(),
      CarbonEntry.findOne({
        userId,
        week: { $ne: week }
      })
        .sort({ week: -1 })
        .lean()
    ]);

    // Reduction bonus
    if (
      lastEntry &&
      calculated.total < lastEntry.emissions.total
    ) {
      user.gamification.greenPoints += 100;
    }

    // Streak logic
    if (mostRecentEntryBeforeThis) {
      if (mostRecentEntryBeforeThis.week === prevWeek) {
        user.gamification.currentStreak += 1;
      } else {
        user.gamification.currentStreak = 1;
      }
    } else {
      user.gamification.currentStreak = 1;
    }

    // Longest streak
    if (
      user.gamification.currentStreak >
      user.gamification.longestStreak
    ) {
      user.gamification.longestStreak =
        user.gamification.currentStreak;
    }

    user.gamification.lastActiveDate = new Date();

    // Level calculation
    const points = user.gamification.greenPoints;

    let newLevel = 1;

    if (points >= 10000) newLevel = 6;
    else if (points >= 6000) newLevel = 5;
    else if (points >= 3000) newLevel = 4;
    else if (points >= 1500) newLevel = 3;
    else if (points >= 500) newLevel = 2;

    user.gamification.level = newLevel;

    // Badge helper
    const hasBadge = (badgeId) =>
      user.gamification.earnedBadges.some(
        (b) => b.id === badgeId
      );

    if (!hasBadge('data-driven')) {
      user.gamification.earnedBadges.push({
        id: 'data-driven',
        earnedAt: new Date()
      });
    }

    if (
      user.gamification.currentStreak >= 7 &&
      !hasBadge('week-warrior')
    ) {
      user.gamification.earnedBadges.push({
        id: 'week-warrior',
        earnedAt: new Date()
      });
    }

    if (
      user.gamification.currentStreak >= 30 &&
      !hasBadge('month-master')
    ) {
      user.gamification.earnedBadges.push({
        id: 'month-master',
        earnedAt: new Date()
      });
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
  return CarbonEntry.find({ userId })
    .sort({ week: -1 })
    .limit(12)
    .lean();
};

const getSummary = async (userId) => {
  const latest = await CarbonEntry.findOne({ userId })
    .sort({ week: -1 })
    .lean();

  if (latest) {
    return latest;
  }

  const user = await User.findById(userId)
    .select('profile persona onboardingCompleted')
    .lean();

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
};

const getProjection = async (userId) => {
  const [history, user] = await Promise.all([
    CarbonEntry.find({ userId })
      .sort({ week: 1 })
      .lean(),

    User.findById(userId)
      .select('profile')
      .lean()
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  const baseline = calculateEmissions(user.profile);

  let latestTotal = baseline.total;
  let dataPoints = [];

  if (history.length > 0) {
    dataPoints = history.map((entry, idx) => ({
      x: idx,
      y: entry.emissions.total
    }));

    latestTotal =
      history[history.length - 1].emissions.total;
  } else {
    dataPoints = [
      { x: 0, y: baseline.total * 1.1 },
      { x: 1, y: baseline.total * 1.05 },
      { x: 2, y: baseline.total }
    ];
  }

  const n = dataPoints.length;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const pt of dataPoints) {
    sumX += pt.x;
    sumY += pt.y;
    sumXY += pt.x * pt.y;
    sumXX += pt.x * pt.x;
  }

  let slope = 0;
  let intercept = latestTotal;

  if (n > 1) {
    const denominator =
      n * sumXX - sumX * sumX;

    if (denominator !== 0) {
      slope =
        (n * sumXY - sumX * sumY) /
        denominator;

      intercept =
        (sumY - slope * sumX) / n;
    }
  }

  const currentTrajectory = [];
  const goalTrajectory = [];
  const optimisticTrajectory = [];

  const goalMultiplier =
    user.profile.goalType === 'reduce50'
      ? 0.5
      : 0.75;

  const startIdx =
    history.length > 0
      ? history.length - 1
      : 2;

  for (let i = 1; i <= 12; i++) {
    const weekIdx = startIdx + i;

    let projVal =
      slope * weekIdx + intercept;

    if (projVal < 20) {
      projVal = 20;
    }

    currentTrajectory.push(
      Math.round(projVal)
    );

    const goalVal =
      latestTotal -
      latestTotal *
        (1 - goalMultiplier) *
        (i / 12);

    goalTrajectory.push(
      Math.round(Math.max(20, goalVal))
    );

    const optVal =
      latestTotal * Math.pow(0.93, i);

    optimisticTrajectory.push(
      Math.round(Math.max(20, optVal))
    );
  }

  return {
    currentTrajectory,
    goalTrajectory,
    optimisticTrajectory,
    labels: Array.from(
      { length: 12 },
      (_, i) => `Week ${i + 1}`
    )
  };
};

function getPreviousWeekStr(weekStr) {
  const [yearStr, weekStrPart] =
    weekStr.split('-W');

  const year = parseInt(yearStr);
  const week = parseInt(weekStrPart);

  if (week === 1) {
    return `${year - 1}-W52`;
  }

  const prevWeek = week - 1;

  return `${year}-W${
    prevWeek < 10
      ? `0${prevWeek}`
      : prevWeek
  }`;
}

module.exports = {
  logWeeklyEntry,
  getHistory,
  getSummary,
  getProjection
};