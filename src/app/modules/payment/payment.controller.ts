import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { paymentService } from './payment.service';

const allPayment = catchAsync(async (req, res) => {
  const filters = pick(req.query, [
    'searchTerm',
    'status',
    'paymentType',
    'userType',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await paymentService.allPayment(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getAllUserPayment = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const filters = pick(req.query, [
    'searchTerm',
    'status',
    'paymentType',
    'userType',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await paymentService.getAllUserPayment(
    userId,
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment user retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const singlePayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await paymentService.singlePayment(id!);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment retrieved successfully',
    data: result,
  });
});

export const paymentController = {
  allPayment,
  getAllUserPayment,
  singlePayment,
};
