import express from 'express';
import { serviceController } from './service.controller';
import { userRole } from '../user/user.constant';
import { auth, serviceAuth } from '../../middlewares/auth';
import { requirePaidSubscription } from '../../middlewares/requireSubscription';

const router = express.Router();

router.post(
  '/register-service',
  serviceAuth(userRole['find care'], userRole['find job']),
  serviceController.registerServiceController,
);

router.get(
  '/locations',
  auth(userRole['find care'], userRole['find job']),
  requirePaidSubscription(),
  serviceController.getAllServiceLocations,
);

router.get(
  '/service-base-user/:categoryId',
  auth(userRole['find care'], userRole['find job']),
  requirePaidSubscription(),
  serviceController.serviceBaseUserController,
);

router.get(
  '/service-user-base-user/:categoryId',
  auth(userRole['find care'], userRole['find job']),
  requirePaidSubscription(),
  serviceController.serviceUserBaseUserController,
);

router.get(
  '/:userId',
  auth(userRole['find care'], userRole['find job']),
  requirePaidSubscription(),
  serviceController.singleUserService,
);

router.delete(
  '/:userId',
  auth(userRole.admin),
  serviceController.deleteService,
);

export const serviceRouter = router;
