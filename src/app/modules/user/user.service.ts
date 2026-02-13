import Stripe from 'stripe';
import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import pagination, { IOption } from '../../helper/pagenation';
import { IUser } from './user.interface';
import User from './user.model';
import config from '../../config';

const createUser = async (payload: IUser) => {
  const user = await User.findOne({ email: payload.email });
  if (user) {
    throw new AppError(400, 'User already exists');
  }
  const idx = Math.floor(Math.random() * 100);
  payload.profileImage = `https://avatar.iran.liara.run/public/${idx}.png`;
  const result = await User.create(payload);

  if (!result) {
    throw new AppError(400, 'Failed to create user');
  }
  return result;
};

const getAllUser = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, minHourRate, maxHourRate, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = [
    'firstName',
    'lastName',
    'bio',
    'phone',
    'status',
    'gender',
    'email',
    'role',
  ];

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

  if (minHourRate || maxHourRate) {
    const hourRateCondition: any = {};

    if (minHourRate) {
      hourRateCondition.$gte = Number(minHourRate);
    }

    if (maxHourRate) {
      hourRateCondition.$lte = Number(maxHourRate);
    }

    andCondition.push({
      hourRate: hourRateCondition,
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const result = await User.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any)
    .populate('service')
    .populate('category');

  if (!result) {
    throw new AppError(404, 'Users not found');
  }

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

const getUserById = async (id: string) => {
  const result = await User.findById(id)
    .populate('category')
    .populate('service');
  if (!result) {
    throw new AppError(404, 'User not found');
  }
  return result;
};

const updateUserById = async (
  id: string,
  payload: IUser,
  file?: Express.Multer.File,
) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  if (file) {
    const uploadProfile = await fileUploader.uploadToCloudinary(file);
    if (!(uploadProfile as any)?.secure_url) {
      throw new AppError(400, 'Failed to upload profile image');
    }
    payload.profileImage = (uploadProfile as any).secure_url;
  }
  const result = await User.findByIdAndUpdate(id, payload, { new: true });
  if (!result) {
    throw new AppError(404, 'User not found');
  }
  return result;
};

const deleteUserById = async (id: string) => {
  const result = await User.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(404, 'User not found');
  }
  return result;
};

const profile = async (id: string) => {
  const result = await User.findById(id);
  if (!result) {
    throw new AppError(404, 'User not found');
  }
  return result;
};

const updateMyProfile = async (
  id: string,
  payload: IUser,
  file?: Express.Multer.File,
) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  if (file) {
    const uploadProfile = await fileUploader.uploadToCloudinary(file);
    if (!(uploadProfile as any)?.secure_url) {
      throw new AppError(400, 'Failed to upload profile image');
    }

    // console.log(uploadProfile)
    payload.profileImage = (uploadProfile as any).secure_url;
  }
  const result = await User.findByIdAndUpdate(id, payload, { new: true });
  if (!result) {
    throw new AppError(404, 'User not found');
  }
  return result;
};

const stripe = new Stripe(config.stripe.secretKey!);

// stripe account create
const createStripeAccount = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  if (user.stripeAccountId) {
    throw new AppError(400, 'User already has a stripe account');
  }

  const account = await stripe.accounts.create({
    type: 'express',
    email: user.email,
    business_type: 'individual',
    individual: {
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      // phone: user.phone,
    },
    business_profile: {
      name: user.firstName,
      product_description: user.bio || 'user descripetion',
      url: 'https://your-default-website.com',
    },
    settings: {
      payments: {
        statement_descriptor: user.bio || 'user descripetion',
      },
    },
  } as any);
  if (!account) {
    throw new AppError(400, 'Failed to create stripe account');
  }

  user.stripeAccountId = account.id;
  await user.save();

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${config.frontendUrl}/connect/refresh`,
    return_url: `${config.frontendUrl}/stripe-account-success`,
    type: 'account_onboarding',
  });

  return {
    url: accountLink.url,
    message: 'Stripe onboarding link created successfully',
  };
};

const getStripeAccount = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  if (!user.stripeAccountId) {
    throw new AppError(400, 'User does not have a stripe account');
  }

  const account = await stripe.accounts.createLoginLink(user.stripeAccountId);
  if (!account) {
    throw new AppError(400, 'Failed to retrieve stripe account');
  }

  return account;
};

export const userService = {
  createUser,
  getAllUser,
  getUserById,
  updateUserById,
  deleteUserById,
  profile,
  updateMyProfile,
  createStripeAccount,
  getStripeAccount,
};
