import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import User from '../user/user.model';
import Payment from './payment.model';

const allPayment = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = ['status', 'paymentType', 'userType'];

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

  const result = await Payment.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any)
    .populate('user')
    .populate({
      path: 'service',
      populate: {
        path: 'categoryId',
      },
    })
    .populate('category');

  if (!result) {
    throw new AppError(404, 'Payment not found');
  }

  const total = await Payment.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const getAllUserPayment = async (
  userId: string,
  params: any,
  options: IOption,
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = ['status', 'paymentType', 'userType'];

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

  andCondition.push({ user });

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const result = await Payment.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any)
    .populate('user')
    .populate({
      path: 'service',
      populate: {
        path: 'categoryId',
      },
    })
    .populate('category')
    .populate('booking');

  if (!result) {
    throw new AppError(404, 'Payment not found');
  }

  const total = await Payment.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const singlePayment = async (id: string) => {
  const result = await Payment.findById(id)
    .populate('user')
    .populate({
      path: 'service',
      populate: {
        path: 'categoryId',
      },
    })
    .populate('category')
    .populate('booking');
  if (!result) throw new AppError(404, 'Payment not found');
  return result;
};

export const paymentService = {
  allPayment,
  getAllUserPayment,
  singlePayment,
};
