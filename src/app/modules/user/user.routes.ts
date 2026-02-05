import express from 'express';
import { userController } from './user.controller';

import { fileUploader } from '../../helper/fileUploder';
import { userRole } from './user.constant';
import { auth } from '../../middlewares/auth';

const router = express.Router();

router.post('/', userController.createUser);

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
router.get('/all-user', userController.getAllUser);

router.put(
  '/:id',
  auth(userRole.admin),
  fileUploader.upload.single('profileImage'),
  userController.updateUserById,
);
router.get('/:id', userController.getUserById);
router.delete('/:id', auth(userRole.admin), userController.deleteUserById);

export const userRoutes = router;
