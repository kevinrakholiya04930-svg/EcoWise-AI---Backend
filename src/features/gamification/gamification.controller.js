const gamificationService = require('./gamification.service');

const getStats = async (req, res, next) => {
  try {
    const data = await gamificationService.getStats(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Gamification stats retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

const getChallenges = async (req, res, next) => {
  try {
    const data = await gamificationService.getChallenges(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Challenges retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

const joinChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await gamificationService.joinChallenge(req.user._id, id);
    res.status(200).json({
      success: true,
      message: 'Successfully joined the challenge',
      data
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const completeChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await gamificationService.completeChallenge(req.user._id, id);
    res.status(200).json({
      success: true,
      message: 'Challenge completed successfully!',
      data
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

module.exports = {
  getStats,
  getChallenges,
  joinChallenge,
  completeChallenge
};
