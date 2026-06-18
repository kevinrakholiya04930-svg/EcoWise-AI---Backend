const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const data = await authService.registerUser(name, email, password);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.loginUser(email, password);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data
    });
  } catch (error) {
    res.status(401);
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Current user profile fetched successfully',
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user._id, currentPassword, newPassword);
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  changePassword
};
