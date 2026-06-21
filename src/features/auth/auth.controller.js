const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const data = await authService.registerUser(
      req.body.name,
      req.body.email,
      req.body.password
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data,
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.loginUser(
      req.body.email,
      req.body.password
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data,
    });
  } catch (error) {
    res.status(401);
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message:
        'Current user profile fetched successfully',
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (
  req,
  res,
  next
) => {
  try {
    await authService.changePassword(
      req.user._id,
      req.body.currentPassword,
      req.body.newPassword
    );

    return res.status(200).json({
      success: true,
      message:
        'Password changed successfully',
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
  changePassword,
};