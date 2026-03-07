import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import Category from '../category/category.model';
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
  await User.findByIdAndUpdate(payload.jobUserId, {
    $push: { reviewRatting: review._id },
  });
  await User.findByIdAndUpdate(userId, {
    $push: { givenReviewRatting: review._id },
  });
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
  await User.findByIdAndUpdate(review.userId, {
    $pull: { givenReviewRatting: review._id },
  });

  await User.findByIdAndUpdate(review.jobUserId, {
    $pull: { reviewRatting: review._id },
  });
  return review;
};

const categoryBaseAllReviews = async (categoryId: string, options: IOption) => {
  const { limit, page, skip, sortBy, sortOrder } = pagination(options);
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new AppError(404, 'Category is not found');
  }

  const reviews = await Review.find({
    jobUserId: { $in: category.findJobUser },
  })
    .populate('userId jobUserId')
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Review.countDocuments({
    jobUserId: { $in: category.findJobUser },
  });

  return {
    data: reviews,
    meta: {
      total,
      page,
      limit,
    },
  };
};

export const reviewService = {
  createReview,
  getAllReview,
  getSingleReview,
  updateReview,
  deleteReview,
  categoryBaseAllReviews,
};
