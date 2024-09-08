// const util = require('util');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  // send token as cookie to server
  const cookieOptions = {
    espires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  const newUser = await User.create({
    name: req.body.name,
    lastname: req.body.lastName,
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  // 2) check if  user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  // const correct = await user.correctPassword(password, user.password); // correct password is instance method (available on all doc of cetrain collection) defined in userSchema.
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // 3) send token to client
  createSendToken(user, 200, res);
});

// PROTECT ROUTES > MIDDLE WARE FOR AUTHENTICATING VIA JWT
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get the token
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next(new AppError('You are not logged in', 401));
  // 2) token varification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3) check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next(new AppError('the user no longer exist', 401));
  // 4) check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) return next(new AppError('User recently changed passsword', 401));
  // GRANT ACCESSS
  req.user = currentUser;
  next();
});
//we create a wrapper func that returns the middle ware function that depends on args
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin','user','lead-guide'] role = 'user'
    if (!roles.includes(req.user.role)) {
      // we have req.user comming in from prev middleware
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1)  get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) return next(new AppError('user not found', 404));
  // 2) generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) send back token as email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a patch request with your new password and password confirm to: ${resetURL}.\nIf you did not request a password reset please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'your password reset token. Valid for 10 minutes',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: `Token sent to email! ${user.email}`,
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('there was an error sending email. Try again later', 500));
  }
});

exports.resetPassword = async (req, res, next) => {
  // 1)  Get user based on the token
  // reset token  in url is non enc unlike db where we have encrypted
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  console.log(hashedToken);
  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

  if (!user) return next(new AppError('token is invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 2)  if token has not expired, and these is user,set the new pasasword

  //  3) update changedPasswordAt prop

  // 4)  log the user in, send JWT

  createSendToken(user, 200, res);
};

// update password for logged in users
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1> get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // we will have the user from protect middle ware that we passed to this route right before the controller
  // const user = req.user;
  // 2> check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Incorrect password', 401));
  }
  // 3> update password if posted is correct
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save(); //User.findByIdandUpdate is not  good to use here as we have middlewares defiend on modal save
  // 4> login user
  createSendToken(user, 200, res);
});
