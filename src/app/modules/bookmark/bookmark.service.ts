import mongoose from 'mongoose';
import AppError from '../../error/appError';
import User from '../user/user.model';
import Bookmark from './bookmark.model';
import pagination, { IOption } from '../../helper/pagenation';

const addBookmark = async (userId: string, providerId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  if (user.role !== 'find care') {
    throw new AppError(403, 'Only find care user can bookmark');
  }

  const provider = await User.findById(providerId);
  if (!provider || provider.role !== 'find job') {
    throw new AppError(404, 'Service provider not found');
  }

  let bookmark = await Bookmark.findOne({ userId });

  if (!bookmark) {
    bookmark = await Bookmark.create({
      userId,
      bookmarkserviceProvider: [providerId],
    });
  } else {
    const isExist = bookmark.bookmarkserviceProvider.includes(
      new mongoose.Types.ObjectId(providerId),
    );

    if (isExist) {
      throw new AppError(400, 'Already bookmarked');
    }

    bookmark.bookmarkserviceProvider.push(
      new mongoose.Types.ObjectId(providerId),
    );
    await bookmark.save();
  }

  return bookmark;
};

const getAllMyBookmark = async (
  userId: string,
  params: any,
  options: IOption,
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const bookmark = await Bookmark.findOne({ userId });

  if (!bookmark || bookmark.bookmarkserviceProvider.length === 0) {
    return {
      data: [],
      meta: {
        total: 0,
        page,
        limit,
      },
    };
  }

  const andCondition: any[] = [
    {
      _id: { $in: bookmark.bookmarkserviceProvider },
    },
  ];

  const userSearchableFields = [
    'firstName',
    'lastName',
    'bio',
    'phone',
    'status',
    'gender',
    'email',
    'role',
    'location',
  ];

  if (searchTerm) {
    andCondition.push({
      $or: userSearchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = { $and: andCondition };

  const result = await User.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any)
    .populate('service');

  const total = await User.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const removeBookmark = async (userId: string, providerId: string) => {
  const bookmark = await Bookmark.findOne({ userId });

  if (!bookmark) {
    throw new AppError(404, 'Bookmark not found');
  }

  const providerIndex = bookmark.bookmarkserviceProvider.findIndex(
    (id) => id.toString() === providerId,
  );

  if (providerIndex === -1) {
    throw new AppError(404, 'Provider not found in bookmarks');
  }

  bookmark.bookmarkserviceProvider.splice(providerIndex, 1);
  await bookmark.save();

  return bookmark;
};

const getSingleBookmarkuser = async (userId: string, providerId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const bookmark = await Bookmark.findOne({ userId }).populate(
    'bookmarkserviceProvider',
  );

  if (!bookmark) {
    return {
      isBookmarked: false,
      provider: null,
    };
  }

  const provider = bookmark.bookmarkserviceProvider.find(
    (provider: any) => provider._id.toString() === providerId,
  );

  if (!provider) {
    return {
      isBookmarked: false,
      provider: null,
    };
  }

  return {
    isBookmarked: true,
    provider,
  };
};

export const bookmarkService = {
  addBookmark,
  getAllMyBookmark,
  removeBookmark,
  getSingleBookmarkuser,
};
