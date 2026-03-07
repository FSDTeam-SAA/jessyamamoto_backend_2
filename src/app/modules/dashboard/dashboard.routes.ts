import express from 'express';
import { auth } from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { dashboardController } from './dashboard.controller';

const router = express.Router();

router.get(
  '/overview',
  auth(userRole.admin),
  dashboardController.dashboardOverview,
);

router.get(
  '/earnings',
  auth(userRole.admin),
  dashboardController.earningsOverview,
);

router.get(
  '/booking-distribution',
  auth(userRole.admin),
  dashboardController.bookingDistribution,
);

router.get(
  '/recent-bookings',
  auth(userRole.admin),
  dashboardController.recentBookings,
);

router.get(
  '/pending-approvals',
  auth(userRole.admin),
  dashboardController.pendingCleanerApprovals,
);

export const dashboardRoutes = router;
