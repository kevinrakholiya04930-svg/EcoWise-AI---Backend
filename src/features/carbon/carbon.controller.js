const carbonService = require('./carbon.service');

const logEntry = async (req, res, next) => {
  try {
    const data = await carbonService.logWeeklyEntry(req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Weekly carbon entry logged successfully',
      data
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const data = await carbonService.getHistory(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Emissions history retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const data = await carbonService.getSummary(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Current emissions summary retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

const getProjection = async (req, res, next) => {
  try {
    const data = await carbonService.getProjection(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Future projections retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  logEntry,
  getHistory,
  getSummary,
  getProjection
};
