const User = require('../models/Users');
const catchAsync = require('../middlewares/catchAsync');

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

  res.status(200).json({
    success: true,
    message: 'User is registered',
    data: user,
  });
});
