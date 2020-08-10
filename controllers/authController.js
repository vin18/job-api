const User = require('../models/Users');
const sendToken = require('../utils/jwtToken');
const catchAsync = require('../middlewares/catchAsync');
const ErrorHandler = require('../utils/errorHandler');

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
