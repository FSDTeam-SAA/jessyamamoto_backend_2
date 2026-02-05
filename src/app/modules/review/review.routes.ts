import express from 'express';

import { userRole } from '../user/user.constant';
import { reviewController } from './review.controller';
import { auth } from '../../middlewares/auth';
const router = express.Router();

router.post(
  '/',
  auth(userRole['find care'], userRole['find job']),
  reviewController.createReview,
);

router.get('/', reviewController.getAllReview);
router.get('/:id', reviewController.getSingleReview);
router.put(
  '/:id',
  auth(userRole.admin, userRole['find job'], userRole['find care']),
  reviewController.updateReview,
);
router.delete('/:id', auth(userRole.admin, userRole['find job'], userRole['find care']), reviewController.deleteReview);

export const reviewRouter = router;
