const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const TourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, `A tour must have a name`],
      unique: true,
      trim: true,
      maxlength: [40, 'Tour name must have less than or equal 40 characters'],
      minlength: [10, 'Tour name must have more than or equal 10 characters'],
      validate: {
        validator: function (value) {
          return validator.isAlpha(value, `en-US`, { ignore: ' ' });
        },
        message: 'The tour name must only contain alphabets',
      },
    },

    duration: { type: Number, required: [true, `A tour must have a duration`] },

    maxGroupSize: {
      type: Number,
      required: [true, `A tour must have a group size`],
    },

    difficulty: {
      type: String,
      required: [true, `A tour must have a difficulty`],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be either: easy, medium or difficult',
      },
    },

    price: { type: Number, required: [true, `A tour must have a rating`] },

    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          return value < this.price;
        },
        message: (props) =>
          `Discount price ${props.value} should be below the actual price`,
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },

    ratingsQuantity: { type: Number, default: 0 },

    summary: {
      type: String,
      trim: true,
      required: [true, `A tour must have a summary`],
    },

    description: { type: String, trim: true },

    imageCover: {
      type: String,
      required: [true, `A tour must have a cover image`],
    },

    images: [String],

    createdAt: { type: Date, default: Date.now(), select: false },

    startDates: [Date],

    slug: { type: String },

    secretTour: { type: Boolean, default: false },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

TourSchema.virtual(`durationWeeks`).get(function () {
  return (this.duration / 7).toFixed(2);
});

// Document middleware
TourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Query middleware
TourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

TourSchema.post(/^find/, function (doc, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!!`);
  next();
});

// Aggregation middleware
TourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', TourSchema);

module.exports = Tour;
