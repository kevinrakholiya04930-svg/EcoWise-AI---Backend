const connectDB = require('../config/db');

const ensureDBConnection = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503);
    next(error);
  }
};

module.exports = ensureDBConnection;
