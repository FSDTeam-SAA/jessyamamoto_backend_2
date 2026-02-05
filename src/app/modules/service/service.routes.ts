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

export const serviceRouter = router;
