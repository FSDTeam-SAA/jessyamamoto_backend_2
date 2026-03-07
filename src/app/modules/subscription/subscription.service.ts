import { ISubscription } from './subscription.interface';
import Subscription from './subscription.model';
import AppError from '../../error/appError';
import { IOption } from '../../helper/pagenation';
import pagination from '../../helper/pagenation';


const createSubscription = async (payload: ISubscription) => {
  const result = await Subscription.create(payload);

  if (!result) {
    throw new AppError(400, 'Subscription creation failed');
  }

  return result;
};

const getAllSubscriptions = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = ['type', 'title', 'description', 'content'];

  if (searchTerm) {
    andCondition.push({
      $or: userSearchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    });
  }

  if (Object.keys(filterData).length) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const result = await Subscription.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  if (!result) {
    throw new AppError(404, 'Subscription not found');
  }

  const total = await Subscription.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const singleSubscription = async (subscriptionId: string) => {
  const result = await Subscription.findById(subscriptionId);
  if (!result) {
    throw new AppError(400, 'Subscription not found');
  }
  return result;
};

const updateSubscription = async (
  subscriptionId: string,
  payload: Partial<ISubscription>,
) => {
  const result = await Subscription.findByIdAndUpdate(subscriptionId, payload, {
    new: true,
  });
  if (!result) {
    throw new AppError(400, 'Subscription not found');
  }
  return result;
};

const deleteSubscription = async (subscriptionId: string) => {
  const result = await Subscription.findByIdAndDelete(subscriptionId);
  if (!result) {
    throw new AppError(400, 'Subscription not found');
  }
  return result;
};

export const subscriptionService = {
  createSubscription,
  getAllSubscriptions,
  singleSubscription,
  updateSubscription,
  deleteSubscription,
};
