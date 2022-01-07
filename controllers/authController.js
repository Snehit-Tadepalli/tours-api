const util = require('util');
const User = require('../models/userModel.js');
const catchAsync = require('../utils/catchAsync.js');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError.js');
const sendEmail = require('../utils/email.js');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY * 1000,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  const token = signToken(newUser._id);

  res.status(201).json({ status: `success`, token, data: { user: newUser } });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const { password } = req.body;

  if (!email || !password)
    return next(new AppError('Please provide valid email & password', 400));

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(`Incorrect email / password`, 401));
  }

  const token = signToken(user._id);

  res.status(200).json({ status: `success`, token });
});

exports.protect = catchAsync(async (req, res, next) => {
  // Check if user has a token in the request header.
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = `${req.headers.authorization.split(' ')[1]}`;
  }

  if (!token || token === `undefined`) {
    return next(
      new AppError(`You are not logged in! Please login for access`, 401)
    );
  }

  // Check if the token is valid or not
  const decoded = await util
    .promisify(jwt.verify)
    .call(null, token, process.env.JWT_SECRET);

  // Cross-check if user had been removed after requesting the token
  const currentUser = await User.findById({ _id: decoded.id });
  if (!currentUser)
    return next(new AppError(`The user with this token no longer exist`, 401));

  // Cross-check if user changed the password after a token was generated
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        `User changed the password recently! Please login again`,
        401
      )
    );
  }

  // Granting access if not of the above conditions are met.
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`You do not have permission to access.`, 403));
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Getting email address from the user for the forgot password request
  let user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError(`No user with that email address`, 404));

  // Generating a random token onto the document which expires in short time
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Sending the temporary token to the user email.
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Your password reset token (Valid for only 10 mins)`,
      message: `Forgot your password? Submit a request with your password and password confirm to the ${resetURL}\n If you didn't request for password reset, Kindly ignore this mail.`,
    });
    res.status(200).json({ status: `success`, message: `Token sent to email` });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        `There was an error sending the reset token, try again later`,
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get token from the user and convert it to hash for comparison
  const hashedToken = crypto
    .createHash(`sha256`)
    .update(req.params.token)
    .digest('hex');

  // Find the user based on token and check if token was not expired, also reset the password
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError(`Token is invalid or has expired`, 400));

  // Update the password changed at property for future reference
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // user.passwordChangedAt = Date.now();
  await user.save();

  // Send back the JWT token to the user to keep looged in
  const token = signToken(user._id);

  res.status(200).json({ status: `success`, token });

  next();
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get user from the collection
  const user = await User.findById(req.user.id).select('+password');

  // Check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError(`Your current password is wrong`, 401));
  }

  console.log(user);

  // If correct, update the password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();
  console.log(user);

  // // Share the updated JWT token
  const token = signToken(user._id);
  res.status(201).json({ status: `success`, token, data: { user: user } });
  next();
});
