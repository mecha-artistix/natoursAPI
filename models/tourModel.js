const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// TOURS SCHEMA > we need this to later create the model out of it. Schema is the blue print for model. It represents the document instance and aslo serve as configurations
const tourSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'A tour must have a name'], unique: true, trim: true },
    slug: { type: String },
    duration: { type: Number, required: [true, 'A tour must have a duration'] },
    maxGroupSize: { type: Number, required: [true, 'A tour must have a group size'] },
    difficulty: { type: String, required: [true, 'A tour must have a difficulty'] },
    ratingsAverage: { type: Number, default: 0 },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: true },
    priceDiscount: {
      type: Number,
      // custom validator. we will return a boolean value
      validate: function (val) {
        return val < this.price;
      },
      message: 'Discount Price ({VALUE}) should be less than the actual price',
    },
    summary: { type: String, trim: true, required: [true, 'A tour must have a summary'] },
    description: { type: String, trim: true },
    imageCover: { type: String, required: [true, 'A tour must have an image'] },
    images: [String],
    createdAt: { type: Date, default: Date.now() },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },
    // below is an embedded obj. it takes certain props
    startLocation: {
      // GeoJSON
      type: { type: String, default: 'Point', enum: ['Point'] },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // 1 way -when creating a doc, user will add an array of userid. we will get the doc of from userId and add them to tour doc. Embedthe objectId in to tour
    // guides: Array,
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    // in mongoose schema we can pass in object with schema modal/defination and also an object with schema options
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// tourSchema.index({ price: 1 }); // 1 -> ascending ; -1 -> descending
tourSchema.index({ price: 1, ratingsAverage: -1 });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
// virtually populate reviews field in tour doc
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
// DOCUMENT MIDDLEWARE : runs before the document is saved
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  // console.log(this);
  next();
});
// middleware for adding guides(users)
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// IN QUERY MIDDLEWARE THIS KW POINT TO CURRENT QUERY
tourSchema.pre(/^find/, function (next) {
  // we use regex to include everything that starts fith find to make the middle ware get triggered for all find queries
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();

  next();
});
tourSchema.pre(/^find/, function (next) {
  this.populate({ path: 'guides', select: '-__v' });
  next();
});

tourSchema.post(/^find/, function () {
  console.log(`Query too ${Date.now() - this.start} milliseconds`);
});
// CREATE MODEL OUT OF ABOVE TOUR SCHEMA
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
