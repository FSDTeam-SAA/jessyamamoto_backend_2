import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { dashboardService } from './dashboard.service';

// GET /dashboard/overview
const dashboardOverview = catchAsync(async (req, res) => {
  const result = await dashboardService.dashboardOverview();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Dashboard overview retrieved successfully',
    data: result,
  });
});

// GET /dashboard/earnings?filter=monthly|weekly
const earningsOverview = catchAsync(async (req, res) => {
  const filter = (req.query.filter as 'monthly' | 'weekly') || 'monthly';
  const result = await dashboardService.earningsOverview(filter);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Earnings overview retrieved successfully',
    data: result,
  });
});

// GET /dashboard/booking-distribution?filter=monthly|weekly
const bookingDistribution = catchAsync(async (req, res) => {
  const filter = (req.query.filter as 'monthly' | 'weekly') || 'monthly';
  const result = await dashboardService.bookingDistribution(filter);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking distribution retrieved successfully',
    data: result,
  });
});

// GET /dashboard/recent-bookings?page=1&limit=10
const recentBookings = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const page = parseInt(req.query.page as string) || 1;
  const result = await dashboardService.recentBookings(limit, page);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Recent bookings retrieved successfully',
    data: result,
  });
});

// GET /dashboard/pending-approvals?page=1&limit=10
const pendingCleanerApprovals = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const page = parseInt(req.query.page as string) || 1;
  const result = await dashboardService.pendingCleanerApprovals(limit, page);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Pending cleaner approvals retrieved successfully',
    data: result,
  });
});

export const dashboardController = {
  dashboardOverview,
  earningsOverview,
  bookingDistribution,
  recentBookings,
  pendingCleanerApprovals,
};