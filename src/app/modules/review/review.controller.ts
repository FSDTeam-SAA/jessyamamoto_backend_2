import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { reviewService } from './review.service';

const createReview = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const result = await reviewService.createReview(userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Review created successfully',
    data: result,
  });
});

const getAllReview = catchAsync(async (req, res) => {
  const filters = pick(req.query, ['searchTerm', 'reviewText']);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await reviewService.getAllReview(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await reviewService.getSingleReview(id!);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review retrieved successfully',
    data: result,
  });
});

const updateReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await reviewService.updateReview(id!, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review updated successfully',
    data: result,
  });
});
const deleteReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await reviewService.deleteReview(id!);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review deleted successfully',
    data: result,
  });
});

const categoryBaseAllReviews = catchAsync(async (req, res) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await reviewService.categoryBaseAllReviews(
    req.params.categoryId!,
    options,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Category base Review retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const reviewController = {
  createReview,
  getAllReview,
  getSingleReview,
  updateReview,
  deleteReview,
  categoryBaseAllReviews,
};
