import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import User from '../user/user.model';
import { IReview } from './review.interface';
import Review from './review.model';

const createReview = async (userId: string, payload: IReview) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User is not found');

  const receviedUser = await User.findById(payload.jobUserId);
  if (!receviedUser) throw new AppError(404, 'Recevied user is not found');

  const review = await Review.create({ ...payload, userId: user._id });
  if (!review) throw new AppError(400, 'Review is not created');
  return review;
};

const getAllReview = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = ['reviewText'];

  if (searchTerm as any) {
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

  const result = await Review.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  if (!result) {
    throw new AppError(404, 'Users not found');
  }

  const total = await Review.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const getSingleReview = async (id: string) => {
  const review = await Review.findById(id);
  if (!review) throw new AppError(404, 'Review is not found');
  return review;
};

const updateReview = async (id: string, payload: Partial<IReview>) => {
  const review = await Review.findByIdAndUpdate(id, payload, { new: true });
  if (!review) throw new AppError(404, 'Review is not found');
  return review;
};

const deleteReview = async (id: string) => {
  const review = await Review.findByIdAndDelete(id);
  if (!review) throw new AppError(404, 'Review is not found');
  return review;
};

export const reviewService = {
  createReview,
  getAllReview,
  getSingleReview,
  updateReview,
  deleteReview,
};
