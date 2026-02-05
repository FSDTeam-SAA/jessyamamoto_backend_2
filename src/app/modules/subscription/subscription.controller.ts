import catchAsycn from '../../utils/catchAsycn';
import { subscriptionService } from './subscription.service';
import sendResponse from '../../utils/sendResponse';
import pick from '../../helper/pick';

const createSubscription = catchAsycn(async (req, res) => {
  const result = await subscriptionService.createSubscription(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'subscribe create successfully',
    data: result,
  });
});

const getAllSubscriptions = catchAsycn(async (req, res) => {
  const filters = pick(req.query, [
    'searchTerm',
    'type',
    'title',
    'description',
    'content',
  ]);
  const options = pick(req.query, [
    'page',
    'limit',
    'skip',
    'sortBy',
    'sortOrder',
  ]);
  const resust = await subscriptionService.getAllSubscriptions(
    filters,
    options,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'subscribe fetched successfully',
    meta: resust.meta,
    data: resust.data,
  });
});

const singleSubscription = catchAsycn(async (req, res) => {
  const result = await subscriptionService.singleSubscription(req.params.id!);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'subscribe successfully',
    data: result,
  });
});

const updateSubscription = catchAsycn(async (req, res) => {
  const result = await subscriptionService.updateSubscription(
    req.params.id!,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'subscribe update successfully',
    data: result,
  });
});

const deleteSubscription = catchAsycn(async (req, res) => {
  const result = await subscriptionService.deleteSubscription(req.params.id!);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'subscribe delete successfully',
    data: result,
  });
});

export const subscriptionController = {
  createSubscription,
  getAllSubscriptions,
  singleSubscription,
  updateSubscription,
  deleteSubscription,
};
