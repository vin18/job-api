const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name'],
  },
  email: {
    type: String,
    required: [true, 'Please enter your email address'],
    unique: true,
    validate: [
      validator.isEmail,
      'Please enter a valid email address',
    ],
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'employeer'],
      message: 'Please select correct role',
    },
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please enter password for your account'],
    minlength: [8, 'Your password must be atleast 8 characters long'],
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

// Encrypting passwords before saving
userSchema.pre('save', async function (next) {
  this.password = await bcrypt.hash(this.password, 10);
});

// Return JSON web token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME,
  });
};

// Compare user password in database password
userSchema.methods.comparePassword = async function (
  enteredPassword
) {
  console.log(String(enteredPassword));
  const isMatch = await bcrypt.compare(
    enteredPassword,
    this.password
  );
  return isMatch;
};

module.exports = mongoose.model('User', userSchema);
