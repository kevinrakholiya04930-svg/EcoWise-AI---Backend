const jwt = require('jsonwebtoken');
const User = require('../features/user/user.model');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ||
        'supersecretkeyreplaceinproduction'
    );

    const user = await User.findById(decoded.id)
      .select('_id name email onboardingCompleted')
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

module.exports = {
  protect
};