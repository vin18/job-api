const User = require('../models/Users');
const catchAsync = require('../middlewares/catchAsync');
const ErrorHandler = require('../utils/errorHandler');
const sendToken = require('../utils/jwtToken');

// @desc    Get current user profile
// @route   /api/v1/me
exports.getUserProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc   Update current user password
// @route  /api/v1/password/update
exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check previous user password
  const isMatched = await user.comparePassword(
    req.body.currentPassword
  );
  if (!isMatched) {
    return next(new ErrorHandler(`Password is incorrect`), 401);
  }

  user.password = req.body.newPassword;
  await user.save();

  sendToken(user, 200, res);
});

// @desc  Update current user data
// @route /api/v1/me/update
exports.updateUser = catchAsync(async (req, res, next) => {
  const { name, email } = req.body;
  const newUserData = {
    name,
    email,
  };

  const user = await User.findByIdAndUpdate(
    req.user.id,
    newUserData,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Delete current user
// @route   /api/v1/me/delete
exports.deleteUser = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.user.id);

  res.cookie('token', 'none', {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Your account has been deleted.',
  });
});
