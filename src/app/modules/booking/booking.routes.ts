import express from 'express';
import { bookingController } from './booking.controller';
import { auth } from '../../middlewares/auth';
import { userRole } from '../user/user.constant';

const router = express.Router();

// ===================== Create Booking =====================
// Only 'find care' users can create bookings
router.post(
  '/',
  auth(userRole['find care']),
  bookingController.createBookingController,
);

// ===================== Get All Bookings (Admin Only) =====================
router.get('/', auth(userRole.admin), bookingController.getAllbooking);

// ===================== Get Booking Statistics =====================
router.get(
  '/stats',
  auth(userRole.admin, userRole['find care'], userRole['find job']),
  bookingController.getBookingStats,
);

// ===================== Get My Bookings =====================
// Users can see their own bookings
router.get(
  '/my-bookings',
  auth(userRole['find care']),
  bookingController.getAllMyBooking,
);

router.get(
  '/user-management',
  auth(userRole.admin),
  bookingController.getUserBookingManagement,
);

// ===================== Get Service Provider Bookings =====================
// Service providers can see bookings for their services
router.get(
  '/my-service-bookings',
  auth(userRole['find job']),
  bookingController.getMyServiceBookings,
);

// ===================== Get Single Booking =====================
router.get(
  '/:id',
  auth(userRole.admin, userRole['find care'], userRole['find job']),
  bookingController.getSingleBooking,
);

// ===================== Update Booking =====================
// Only find care (booking owner) can update status. PUT {{base_url}}/booking/:id
router.put(
  '/:id',
  auth(userRole.admin, userRole['find care']),
  bookingController.updateBooking,
);
router.patch(
  '/:id',
  auth(userRole.admin, userRole['find care']),
  bookingController.updateBooking,
);

// ===================== Cancel Booking =====================
router.patch(
  '/:id/cancel',
  auth(userRole.admin, userRole['find care']),
  bookingController.cancelBooking,
);

// ===================== Delete Booking (Admin Only) =====================
router.delete('/:id', auth(userRole.admin), bookingController.deleteBooking);

export const bookingRouter = router;
