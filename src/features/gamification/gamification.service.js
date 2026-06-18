const User = require('../user/user.model');
const Challenge = require('./challenge.model');

const getStats = async (userId) => {
  const user = await User.findById(userId).select('gamification name persona');
  if (!user) {
    throw new Error('User not found');
  }
  return user.gamification;
};

const getChallenges = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const allChallenges = await Challenge.find({});
  
  // Map through challenges and mark active/completed
  const activeIds = user.gamification.activeChallenges.map(c => c.id);
  const completedIds = user.gamification.earnedBadges.map(b => b.id); // for demo we can map completed challenges to badges or let them stand alone.
  // Wait! In the user schema:
  // user.gamification.earnedBadges holds earned badges.
  // Let's make sure we return challenges with flags: `isActive: boolean` and `isCompleted: boolean`
  // Since we don't have a separate completedChallenges array in user schema (we deleted it to make it lean, wait, let's look at user model: user schema does not have completedChallenges, but let's check user model we created: it only has earnedBadges and activeChallenges. Perfect! We can store completed challenges in a simple list or treat badge rewards as completion trackers).
  // Let's assume completed challenge IDs are stored in activeChallenges once completed, or let's check.
  // Wait, let's keep track of completed challenge IDs by checking if the user earned the badge corresponding to the challenge, or let's add a quick helper to track completed challenge IDs on the fly, or just map them!
  // Wait, let's check user schema. If we want a separate completedChallenges field, we can query activeChallenges and check. To make it extremely simple and bulletproof, when a challenge is completed, we remove it from `activeChallenges` and add its ID (or a badge ID) to user's badges.
  // Let's define the mapping:
  const challenges = allChallenges.map(ch => {
    const isJoined = activeIds.includes(ch._id.toString());
    const isFinished = user.gamification.earnedBadges.some(b => b.id === `challenge-${ch._id}`);
    return {
      ...ch.toObject(),
      isJoined,
      isFinished
    };
  });

  return challenges;
};

const joinChallenge = async (userId, challengeId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new Error('Challenge not found');
  }

  // Check if already joined or completed
  const activeIds = user.gamification.activeChallenges.map(c => c.id);
  if (activeIds.includes(challengeId)) {
    throw new Error('Challenge is already active');
  }

  const isFinished = user.gamification.earnedBadges.some(b => b.id === `challenge-${challengeId}`);
  if (isFinished) {
    throw new Error('Challenge already completed');
  }

  user.gamification.activeChallenges.push({ id: challengeId, startedAt: new Date() });
  await user.save();
  return user.gamification;
};

const completeChallenge = async (userId, challengeId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new Error('Challenge not found');
  }

  // Verify challenge is active
  const activeIndex = user.gamification.activeChallenges.findIndex(c => c.id === challengeId);
  if (activeIndex === -1) {
    throw new Error('Challenge is not active or not joined');
  }

  // Remove from active
  user.gamification.activeChallenges.splice(activeIndex, 1);

  // Add points
  user.gamification.greenPoints += challenge.pointsReward;

  // Add completion badge
  user.gamification.earnedBadges.push({
    id: `challenge-${challengeId}`,
    earnedAt: new Date()
  });

  // Level Up logic
  // Level 1: 0, Level 2: 500, Level 3: 1500, Level 4: 3000, Level 5: 6000, Level 6: 10000
  const points = user.gamification.greenPoints;
  let newLevel = 1;
  if (points >= 10000) newLevel = 6;
  else if (points >= 6000) newLevel = 5;
  else if (points >= 3000) newLevel = 4;
  else if (points >= 1500) newLevel = 3;
  else if (points >= 500) newLevel = 2;

  user.gamification.level = newLevel;

  await user.save();
  return {
    gamification: user.gamification,
    pointsAwarded: challenge.pointsReward,
    levelUp: newLevel > user.gamification.level
  };
};

module.exports = {
  getStats,
  getChallenges,
  joinChallenge,
  completeChallenge
};
