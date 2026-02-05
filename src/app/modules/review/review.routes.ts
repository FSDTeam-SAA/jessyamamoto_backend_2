import express from 'express';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { reviewController } from './review.controller';
const router = express.Router();

router.post(
  '/',
  auth(userRole.user, userRole.job),
  reviewController.createReview,
);

router.get('/', reviewController.getAllReview);
router.get('/:id', reviewController.getSingleReview);
router.put(
  '/:id',
  auth(userRole.admin, userRole.job, userRole.user),
  reviewController.updateReview,
);
router.delete('/:id',auth(userRole.admin, userRole.job, userRole.user), reviewController.deleteReview);

export const reviewRouter = router;
