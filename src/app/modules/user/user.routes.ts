import express from 'express';
import { userController } from './user.controller';

import { fileUploader } from '../../helper/fileUploder';
import { userRole } from './user.constant';
import { auth } from '../../middlewares/auth';

const router = express.Router();

router.post('/', userController.createUser);

// Stripe account create
router.post(
  '/create-stripe-account',
  auth(userRole['find job']),
  userController.createStripeAccount,
);

// Stripe dashboard link
router.get(
  '/dashboard-link',
  auth(userRole['find job']),
  userController.getStripeAccount,
);

router.get(
  '/profile',
  auth(userRole.admin, userRole['find care'], userRole['find job']),
  userController.profile,
);
router.put(
  '/profile',
  auth(userRole.admin, userRole['find care'], userRole['find job']),
  fileUploader.upload.single('profileImage'),
  userController.updateMyProfile,
);
router.get('/all-user', auth(userRole.admin), userController.getAllUser);

router.put(
  '/:id',
  auth(userRole.admin),
  fileUploader.upload.single('profileImage'),
  userController.updateUserById,
);
router.get('/:id', userController.getUserById);
router.delete('/:id', auth(userRole.admin), userController.deleteUserById);

export const userRoutes = router;
