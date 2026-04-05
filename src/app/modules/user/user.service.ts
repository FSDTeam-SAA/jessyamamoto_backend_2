import Stripe from 'stripe';
import mongoose from 'mongoose';
import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import pagination, { IOption } from '../../helper/pagenation';
import Payment from '../payment/payment.model';
import Service from '../service/service.model';
import { IUser } from './user.interface';
import User from './user.model';
import config from '../../config';
import { getLocationFromZip } from '../../helper/geocode';

/**
 * Category ids for home "My Services": completed subscription payments for this user.
 * Resolves category from payment.category (preferred), linked payment.service → Service.categoryId,
 * or pendingServiceRegistration.categoryId (edge cases).
 */
export const getMyServicesPaidCategoryIds = async (
  userId: string,
): Promise<string[]> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return [];
  }
  const uid = new mongoose.Types.ObjectId(userId);

  const payments = await Payment.find({
    user: uid,
    status: 'completed',
    paymentType: 'subscription',
  })
    .select('category service pendingServiceRegistration createdAt')
    .sort({ createdAt: 1 })
    .lean();

  const serviceOidList = payments
    .map((p) => p.service)
    .filter((s): s is mongoose.Types.ObjectId => s != null);

  const serviceCategoryByServiceId = new Map<string, string>();
  if (serviceOidList.length > 0) {
    const svcDocs = await Service.find({
      _id: { $in: serviceOidList },
    })
      .select('_id categoryId')
      .lean();
    for (const s of svcDocs) {
      const cid = s.categoryId?.toString();
      if (cid) serviceCategoryByServiceId.set(s._id.toString(), cid);
    }
  }

  const ordered: string[] = [];
  const seen = new Set<string>();

  const pushCat = (raw: string | undefined | null) => {
    const id = raw?.toString().trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    ordered.push(id);
  };

  for (const p of payments) {
    if (p.category) {
      pushCat(p.category.toString());
      continue;
    }
    if (p.service) {
      pushCat(serviceCategoryByServiceId.get(p.service.toString()));
      continue;
    }
    const pending = p.pendingServiceRegistration as
      | { categoryId?: string }
      | undefined;
    if (pending?.categoryId) {
      pushCat(pending.categoryId);
    }
  }

  return ordered;
};

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
  const result = await User.findById(id)
    .populate('totalBooking')
    .populate('givenReviewRatting');
  if (!result) {
    throw new AppError(404, 'User not found');
  }
  return {
    ...result.toObject(),
    myServicesPaidCategoryIds: await getMyServicesPaidCategoryIds(id),
  };
};

const updateMyProfile = async (
  id: string,
  payload: Partial<IUser>,
  file?: Express.Multer.File,
) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // profile image upload
  if (file) {
    const uploadProfile = await fileUploader.uploadToCloudinary(file);

    if (!(uploadProfile as any)?.secure_url) {
      throw new AppError(400, 'Failed to upload profile image');
    }

    payload.profileImage = (uploadProfile as any).secure_url;
  }

  // ZIP changed → update location
  if (payload.zip && payload.zip !== user.zip) {
    const locationData = await getLocationFromZip(payload.zip);

    if (locationData) {
      payload.location = locationData.location;
      payload.lat = locationData.lat;
      payload.lng = locationData.lng;
    }
  }

  // update user
  const result = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(404, 'User not found');
  }

  return result;
};

const stripe = new Stripe(config.stripe.secretKey!);

// stripe account create (Stripe requires 5–22 chars for statement_descriptor)
const formatStatementDescriptor = (text: string) => {
  if (!text) return 'USER SERVICE';

  let s = text
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .substring(0, 22)
    .trim();

  if (!s) return 'USER SERVICE';

  if (s.length < 5) {
    s = `${s} SVC`.substring(0, 22).trim();
    if (s.length < 5) return 'USER SERVICE';
  }

  return s;
};

const createAccountOnboardingLink = (accountId: string) =>
  stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${config.frontendUrl}/connect/refresh`,
    return_url: `${config.frontendUrl}/stripe-account-success`,
    type: 'account_onboarding',
  });

const createStripeAccount = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  if (user.stripeAccountId) {
    const existing = await stripe.accounts.retrieve(user.stripeAccountId);
    if (!existing.details_submitted) {
      const accountLink = await createAccountOnboardingLink(user.stripeAccountId);
      return {
        url: accountLink.url,
        message: 'Continue Stripe onboarding',
      };
    }
    const login = await stripe.accounts.createLoginLink(user.stripeAccountId);
    return {
      url: login.url,
      message: 'Stripe account is ready',
    };
  }

  const account = await stripe.accounts.create({
    type: 'express',
    email: user.email,
    business_type: 'individual',
    individual: {
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
    },
    business_profile: {
      name: user.firstName,
      product_description: user.bio || 'User service',
      url: 'https://your-default-website.com',
    },
    settings: {
      payments: {
        statement_descriptor: formatStatementDescriptor(
          `${user.firstName} ${user.lastName}`.trim(),
        ),
      },
    },
  } as any);

  if (!account) {
    throw new AppError(400, 'Failed to create stripe account');
  }

  user.stripeAccountId = account.id;
  await user.save();

  const accountLink = await createAccountOnboardingLink(account.id);

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

  const connected = await stripe.accounts.retrieve(user.stripeAccountId);

  if (!connected.details_submitted) {
    const accountLink = await createAccountOnboardingLink(user.stripeAccountId);
    return {
      url: accountLink.url,
      message: 'Complete Stripe onboarding to open the dashboard',
    };
  }

  try {
    const login = await stripe.accounts.createLoginLink(user.stripeAccountId);
    if (!login) {
      throw new AppError(400, 'Failed to retrieve stripe account');
    }
    return login;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/onboarding|not completed/i.test(msg)) {
      const accountLink = await createAccountOnboardingLink(user.stripeAccountId);
      return {
        url: accountLink.url,
        message: 'Complete Stripe onboarding to open the dashboard',
      };
    }
    throw err;
  }
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
  getMyServicesPaidCategoryIds,
};
