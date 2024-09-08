const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });
// /:tourId/reviews > this is redirected route from tour router
router
  .route('/')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  )
  .get(authController.protect, reviewController.getAllReviews);

// router
//   .route('/')
//   .get(authController.protect, reviewController.getAllReviews)
//   .post(authController.protect, authController.restrictTo('user'), reviewController.createReview);

router
  .route('/:id')
  .delete(reviewController.deleteReview)
  .patch(reviewController.updateReview)
  .get(reviewController.getReview);

module.exports = router;
