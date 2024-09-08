const User = require('../models/userModel');
const multer = require('multer');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
// Users Route Handlers

// to configure multer upload to our needs we create multer storage and multer filter which we use to create the upload
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    // user-231231231231-23131231231.jpeg > user-userId-timeStamp
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  //  test if uploaded file is image ->return boolean
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an Image! please upload correct image'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// we configure where we will  be storing uploaded images
// V.1) - const upload = multer({ dest: 'public/img/users' });
// we can just  call multer function without the dest, in that case multer will store images in memory and not on the disk
// in db we will have name(string) for each image that points to the image on disk

exports.uploadUserPhoto = upload.single('photo'); // we pass name of the form field that will hold image to upload.this middle warealso put info aboutthe file on req obj

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.body, req.file);
  // 1) Create error if user post password data
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError('this route is not for password updates', 400));
  // 2) update userData
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);
// do not attempt to update password with this
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
