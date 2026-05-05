import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import Category from '../category/category.model';
import User from '../user/user.model';
import Booking from '../booking/booking.model';
import Service from '../service/service.model';
import { IReview } from './review.interface';
import Review from './review.model';

const createReview = async (userId: string, payload: IReview) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User is not found');
  if (user.role !== 'find care') {
    throw new AppError(403, 'Only find care users can submit reviews');
  }

  if (!payload.jobUserId) {
    throw new AppError(400, 'jobUserId is required');
  }

  const receviedUser = await User.findById(payload.jobUserId);
  if (!receviedUser) throw new AppError(404, 'Recevied user is not found');
  if (receviedUser.role !== 'find job') {
    throw new AppError(400, 'You can only review find job caregivers');
  }
  if (receviedUser._id.toString() === user._id.toString()) {
    throw new AppError(400, 'You cannot review yourself');
  }

  const caregiverServices = await Service.find({
    userId: receviedUser._id,
  }).select('_id');
  const caregiverServiceIds = caregiverServices.map((s) => s._id);

  if (caregiverServiceIds.length === 0) {
    throw new AppError(
      400,
      'Review is only allowed after a completed booking with this caregiver',
    );
  }

  const completedBooking = await Booking.findOne({
    userId: user._id,
    serviceId: { $in: caregiverServiceIds },
    status: 'completed',
  }).select('_id');

  if (!completedBooking) {
    throw new AppError(
      403,
      'You can review this caregiver only after the booking is completed',
    );
  }

  const alreadyReviewed = await Review.findOne({
    userId: user._id,
    jobUserId: receviedUser._id,
  }).select('_id');
  if (alreadyReviewed) {
    throw new AppError(400, 'You already reviewed this caregiver');
  }

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
