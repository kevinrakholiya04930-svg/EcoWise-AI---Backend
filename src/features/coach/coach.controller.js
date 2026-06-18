const coachService = require('./coach.service');

const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    const reply = await coachService.handleChat(req.user._id, message);
    res.status(200).json({
      success: true,
      message: 'AI coach response generated',
      data: { reply }
    });
  } catch (error) {
    next(error);
  }
};

const getReport = async (req, res, next) => {
  try {
    const report = await coachService.getWeeklyReport(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Weekly narrative report retrieved successfully',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chat,
  getReport
};
