import express from 'express';
import { auth } from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { paymentController } from './payment.controller';
const router = express.Router();

router.get('/', auth(userRole.admin), paymentController.allPayment);
router.get(
  '/user',
  auth(userRole['find care'], userRole['find job']),
  paymentController.getAllUserPayment,
);
router.get(
  '/:id',
  auth(userRole.admin, userRole['find care'], userRole['find job']),
  paymentController.singlePayment,
);

export const paymentRouter = router;
