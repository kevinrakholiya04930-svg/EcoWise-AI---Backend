const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../user/user.model');

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'supersecretkeyreplaceinproduction';

const generateToken = (id) =>
  jwt.sign(
    { id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

const registerUser = async (
  name,
  email,
  password
) => {
  const userExists =
    await User.exists({ email });

  if (userExists) {
    throw new Error(
      'User already exists'
    );
  }

  const passwordHash =
    await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(
      user._id.toString()
    ),
  };
};

const loginUser = async (
  email,
  password
) => {
  const user =
    await User.findOne({ email });

  if (!user) {
    throw new Error(
      'Invalid email or password'
    );
  }

  const isMatch =
    await bcrypt.compare(
      password,
      user.passwordHash
    );

  if (!isMatch) {
    throw new Error(
      'Invalid email or password'
    );
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(
      user._id.toString()
    ),
    onboardingCompleted:
      user.onboardingCompleted,
  };
};

const changePassword =
  async (
    userId,
    currentPassword,
    newPassword
  ) => {
    const user =
      await User.findById(userId);

    if (!user) {
      throw new Error(
        'User not found'
      );
    }

    const isMatch =
      await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );

    if (!isMatch) {
      throw new Error(
        'Invalid current password'
      );
    }

    user.passwordHash =
      await bcrypt.hash(
        newPassword,
        10
      );

    await user.save();

    return true;
  };

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  generateToken,
};