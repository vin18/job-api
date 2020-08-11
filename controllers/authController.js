const crypto = require('crypto');
const User = require('../models/Users');
const sendToken = require('../utils/jwtToken');
const catchAsync = require('../middlewares/catchAsync');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new user
// @route   /api/v1/register
exports.registerUser = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  // Create JWT Token
  sendToken(user, 200, res);
});

// @desc  Login User
// @route /api/v1/login
exports.loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email or password is entered by user
  if (!email || !password) {
    return next(
      newErrorHandler(`Please enter email and password`),
      400
    );
  }

  // Finding user in database
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorHandler(`Invalid Email or Password`), 401);
  }

  // Check if password is correct
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler(`Invalid email or password`), 401);
  }

  // Create JSON Web Token
  sendToken(user, 200, res);
});

// @desc  Forgot Password
// @route /api/v1/password/forgot
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Check user email in database
  if (!user) {
    return next(
      new ErrorHandler(`No user found with this email`),
      404
    );
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({
    validateBeforeSave: false,
  });

  // Create reset password url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/password/reset/${resetToken}`;

  const message = `Your password reset link is as follow:\n\n${resetUrl}\n\n. If you have not requested this, then please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Job API Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent successfully to: ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({
      validateBeforeSave: false,
    });

    return next(new ErrorHandler(`Email is not sent`), 500);
  }
});

// @desc   Reset Password
// @route  /api/v1/password/reset/:token
exports.resetPassword = catchAsync(async (req, res, next) => {
  // Hash URL token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gte: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(`Password Reset token is invalid`, 400)
    );
  }

  // Setup new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendToken(user, 200, res);
});

// @desc  Logout user
// @route /api/v1/logout
exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully!',
  });
});
