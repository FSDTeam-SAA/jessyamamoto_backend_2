import { Request, Response } from 'express';
import { bookingService } from './booking.service';
import sendResponse from '../../utils/sendResponse';
import catchAsync from '../../utils/catchAsycn';
import pick from '../../helper/pick';

// ===================== Create Booking =====================
const createBookingController = catchAsync(
  async (req: Request, res: Response) => {
    const { serviceId, day, date, time } = req.body;

    if (!serviceId || !day || !date || !time) {
      return sendResponse(res, {
        statusCode: 400,
        success: false, 
        message: 'Missing required fields: serviceId, day, date, time',
        data: null,
      });
    }

    const result = await bookingService.createBooking({
      serviceId,
      day,
      date,
      time,
      userId: req.user!.id,
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Booking created successfully. Please complete payment.',
      data: result,
    });
  },
);

// ===================== Get All Bookings (Admin) =====================
const getAllbooking = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    'searchTerm',
    'userId',
    'serviceId',
    'status',
    'date',
    'day',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await bookingService.getAllBooking(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bookings retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

// ===================== Get My Bookings (User) =====================
const getAllMyBooking = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const filters = pick(req.query, [
    'searchTerm',
    'status',
    'date',
    'day',
    'upcoming',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await bookingService.getAllMyBooking(userId, filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My bookings retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

// ===================== Get My Service Bookings (Service Provider) =====================
const getMyServiceBookings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const filters = pick(req.query, [
    'searchTerm',
    'status',
    'date',
    'day',
    'upcoming',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await bookingService.getMyServiceBookings(
    userId,
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service bookings retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

// ===================== Get Single Booking =====================
const getSingleBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const role = req.user?.role;

  const result = await bookingService.getSingleBooking(id!, userId, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking retrieved successfully',
    data: result,
  });
});

// ===================== Update Booking =====================
const updateBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const result = await bookingService.updateBooking(id!, req.body, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking updated successfully',
    data: result,
  });
});

// ===================== Cancel Booking =====================
const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const result = await bookingService.cancelBooking(id!, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking cancelled successfully',
    data: result,
  });
});

// ===================== Delete Booking (Admin Only) =====================
const deleteBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await bookingService.deleteBooking(id!);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking deleted successfully',
    data: result,
  });
});

// ===================== Get Booking Statistics =====================
const getBookingStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  // const role = req.user?.role;

  const result = await bookingService.getBookingStats(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking statistics retrieved successfully',
    data: result,
  });
});

const getUserBookingManagement = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, ['page', 'limit']);

    const result = await bookingService.getUserBookingManagement(options);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User booking management data fetched',
      data: result.data,
      meta: result.meta,
    });
  },
);

export const bookingController = {
  createBookingController,
  getAllbooking,
  getSingleBooking,
  getAllMyBooking,
  getMyServiceBookings,
  deleteBooking,
  updateBooking,
  cancelBooking,
  getBookingStats,
  getUserBookingManagement,
};
