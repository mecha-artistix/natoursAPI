const express = require('express');
// const tourControllerV1 = require('../controllers/tourControllerV1');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();
// Param Middleware -> Special Type of middleware that runs for only certain param
// router.param('id', tourControllerV1.checkID);

// checkBody Middleware function.
// router.param('id', tourController.checkBody);

router.use('/:tourId/reviews', reviewRouter);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);
router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/').get(authController.protect, tourController.getAllTours).post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);
// altough we cannot pass args to middleware func. look at authContro/restrictTo func to see how we tackle this
// .patch(tourControllerV1.updateTour);

// we will excess reviews on a certain tour.
// GET /tour/:tourId/reviews/:reviewId
// router
//   .route('/:tourId/reviews')
//   .post(authController.protect, authController.restrictTo('user'), reviewController.createReview);

module.exports = router;
