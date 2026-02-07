import express from 'express';
import { serviceController } from './service.controller';
import { userRole } from '../user/user.constant';
import { serviceAuth } from '../../middlewares/auth';

const router = express.Router();

router.post(
  '/register-service',
  serviceAuth(userRole['find care'], userRole['find job']),
  serviceController.registerServiceController,
);

router.get(
  '/service-base-user/:categoryId',
  serviceAuth(userRole['find care'], userRole['find job']),
  serviceController.serviceBaseUserController,
);

export const serviceRouter = router;
