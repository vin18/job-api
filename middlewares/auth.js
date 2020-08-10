const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const catchAsync = require('./catchAsync');
const ErrorHandler = require('../utils/errorHandler');

// Check if user is authenticated or not
exports.isAuthenticatedUser = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new ErrorHandler('Login first to access this resource'),
      401
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);

  next();
});
