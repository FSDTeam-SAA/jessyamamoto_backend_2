import express from 'express';
import { auth } from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { bookmarkController } from './bookmark.controller';
const router = express.Router();

router.post(
  '/:providerId',
  auth(userRole['find care']),
  bookmarkController.addBookmark,
);
router.get(
  '/',
  auth(userRole['find care']),
  bookmarkController.getAllMyBookmark,
);

router.delete(
  '/:providerId',
  auth(userRole['find care']),
  bookmarkController.removeBookmark,
);
router.get(
  '/:providerId',
  auth(userRole['find care']),
  bookmarkController.getSingleBookmarkuser,
);

export const bookmarkRoutes = router;
