// import User from '../user/user.model';
// import Category from '../category/category.model';
// import Subscription from '../subscription/subscription.model';
// import Payment from '../payment/payment.model';
// import Service from '../service/service.model';
// import AppError from '../../error/appError';
// import Stripe from 'stripe';
// import config from '../../config';
// import mongoose from 'mongoose';
// import { IUser } from '../user/user.interface';

// const stripe = new Stripe(config.stripe.secretKey!);

// const registerServiceAndSubscription = async (payload: any,userId:string) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     let user: IUser & { _id: mongoose.Types.ObjectId };

//     /* ----------------------------------------------------
//        1️⃣ FIND OR CREATE USER
//     ---------------------------------------------------- */
//     if (payload.email) {
//       const foundUser = await User.findOne({ email: payload.email }).session(
//         session,
//       );
//       if (!foundUser) throw new AppError(404, 'User not found');
//       user = foundUser;
//     } else {
//       let foundUser = await User.findOne({ email: payload.email }).session(
//         session,
//       );

//       if (!foundUser) {
//         const newUser = await User.create(
//           [
//             {
//               email: payload.email,
//               password: payload.password,
//               firstName: payload.firstName,
//               lastName: payload.lastName,
//               role: payload.role,
//               zip: 1234,
//             },
//           ],
//           { session },
//         );
//         user = newUser[0]!;
//       } else {
//         user = foundUser;
//       }
//     }

//     /* ----------------------------------------------------
//        2️⃣ SUBSCRIPTION STATE
//     ---------------------------------------------------- */
//     const now = new Date();
//     const hasActiveSubscription =
//       user.isSubscription === true &&
//       user.subscriptionExpiry !== undefined &&
//       user.subscriptionExpiry > now;

//     /* ----------------------------------------------------
//        3️⃣ BLOCK DOUBLE SUBSCRIBE (CRITICAL FIX)
//     ---------------------------------------------------- */
//     if (hasActiveSubscription && payload.subscriptionId) {
//       throw new AppError(400, 'You already have an active subscription');
//     }

//     let checkoutSession: Stripe.Checkout.Session | null = null;

//     /* ----------------------------------------------------
//        4️⃣ CREATE STRIPE CHECKOUT (IF NEEDED)
//     ---------------------------------------------------- */
//     if (!hasActiveSubscription && payload.subscriptionId) {
//       const subscription = await Subscription.findById(
//         payload.subscriptionId,
//       ).session(session);

//       if (!subscription) {
//         throw new AppError(404, 'Subscription not found');
//       }

//       checkoutSession = await stripe.checkout.sessions.create({
//         mode: 'payment',
//         payment_method_types: ['card'],
//         customer_email: user.email,
//         line_items: [
//           {
//             price_data: {
//               currency: 'usd',
//               unit_amount: subscription.price * 100,
//               product_data: {
//                 name: subscription.title,
//                 description: subscription.description || '',
//               },
//             },
//             quantity: 1,
//           },
//         ],
//         success_url: `${config.frontendUrl || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${config.frontendUrl || 'http://localhost:3000'}/payment-cancel`,
//         metadata: {
//           userId: user._id!.toString(),
//           subscriptionId: subscription._id.toString(),
//           paymentType: 'subscription',
//         },
//       });

//       await Payment.create(
//         [
//           {
//             user: user._id!,
//             subscription: subscription._id,
//             amount: subscription.price,
//             currency: 'usd',
//             stripeSessionId: checkoutSession.id,
//             status: 'pending',
//             paymentType: 'subscription',
//             userType: user.role === 'find job' ? 'findJob' : 'findCare',
//           },
//         ],
//         { session },
//       );
//     }

//     /* ----------------------------------------------------
//        5️⃣ CREATE SERVICE (RULE-BASED)
//     ---------------------------------------------------- */
//     // Service is allowed if:
//     // - first time
//     // - already subscribed (NO subscriptionId)
//     // - subscription expired + new subscribe

//     const service = await Service.create(
//       [
//         {
//           userId: user._id!,
//           categoryId: payload.categoryId,
//           location: payload.location,
//           email: user.email,
//           firstName: user.firstName,
//           lastName: user.lastName || '',
//           gender: payload.gender,
//           hourRate: user.role === 'find job' ? payload.hourRate : undefined,
//           days: payload.days,
//         },
//       ],
//       { session },
//     );

//     /* ----------------------------------------------------
//        6️⃣ UPDATE USER (CATEGORY + SERVICE)
//     ---------------------------------------------------- */
//     await User.findByIdAndUpdate(
//       user._id!,
//       {
//         $addToSet: {
//           category: payload.categoryId,
//           service: service[0]?._id,
//         },
//       },
//       { session },
//     );

//     /* ----------------------------------------------------
//        7️⃣ UPDATE CATEGORY USER LIST
//     ---------------------------------------------------- */
//     await Category.findByIdAndUpdate(
//       payload.categoryId,
//       user.role === 'find care'
//         ? { $addToSet: { findCareUser: user._id! } }
//         : { $addToSet: { findJobUser: user._id! } },
//       { session },
//     );

//     await session.commitTransaction();
//     session.endSession();

//     return {
//       user,
//       service: service[0]!,
//       checkoutUrl: checkoutSession?.url || null,
//     };
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
// };

// export const serviceService = {
//   registerServiceAndSubscription,
// };

import User from '../user/user.model';
import Category from '../category/category.model';
import Subscription from '../subscription/subscription.model';
import Payment from '../payment/payment.model';
import Service from '../service/service.model';
import AppError from '../../error/appError';
import Stripe from 'stripe';
import config from '../../config';
import mongoose from 'mongoose';
import pagination, { IOption } from '../../helper/pagenation';

const stripe = new Stripe(config.stripe.secretKey!);

const registerServiceAndSubscription = async (
  payload: any,
  userId?: string,
) => {
  /* ================= GET OR CREATE USER ================= */
  let user = null;

  if (userId) {
    user = await User.findById(userId);
    if (!user) throw new AppError(404, 'User not found');
  } else {
    // First-time user
    if (!payload.email || !payload.firstName || !payload.role) {
      throw new AppError(
        400,
        'Email, firstName and role are required for new users',
      );
    }

    user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        email: payload.email,
        password: payload.password || 'defaultpassword', // optional default
        firstName: payload.firstName,
        lastName: payload.lastName || '',
        role: payload.role,
        location: payload.location || 1234,
      });
    }
  }

  /* ================= SUBSCRIPTION STATE ================= */
  const now = new Date();
  const hasActiveSubscription =
    user.isSubscription &&
    user.subscriptionExpiry &&
    user.subscriptionExpiry > now;

  /* ================= BLOCK DOUBLE SUBSCRIBE ================= */

  if (
    hasActiveSubscription &&
    payload.subscriptionId &&
    payload.forceSubscribe === true
  ) {
    throw new AppError(400, 'You already have an active subscription');
  }

  // if (hasActiveSubscription && payload.subscriptionId) {
  //   throw new AppError(400, 'You already have an active subscription');
  // }

  /* ================= STRIPE CHECKOUT ================= */
  let checkoutSession: Stripe.Checkout.Session | null = null;
  let subscriptionDoc: any = null;

  if (!hasActiveSubscription && payload.subscriptionId) {
    subscriptionDoc = await Subscription.findById(payload.subscriptionId);
    if (!subscriptionDoc) throw new AppError(404, 'Subscription not found');

    checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: subscriptionDoc.price * 100,
            product_data: {
              name: subscriptionDoc.title,
              description: subscriptionDoc.description,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${config.frontendUrl}/payment-success`,
      cancel_url: `${config.frontendUrl}/payment-cancel`,
      metadata: {
        userId: user._id.toString(),
        subscriptionId: subscriptionDoc._id.toString(),
        paymentType: 'subscription',
      },
    });
  }

  /* ================= DB TRANSACTION ================= */
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /* ---------- PAYMENT RECORD ---------- */
    if (checkoutSession && subscriptionDoc) {
      await Payment.create(
        [
          {
            user: user._id,
            subscription: subscriptionDoc._id,
            amount: subscriptionDoc.price,
            currency: 'usd',
            stripeSessionId: checkoutSession.id,
            status: 'pending',
            paymentType: 'subscription',
            userType: user.role === 'find job' ? 'findJob' : 'findCare',
          },
        ],
        { session },
      );
    }

    /* ---------- CREATE SERVICE ---------- */
    const service = await Service.create(
      [
        {
          userId: user._id,
          categoryId: payload.categoryId,
          location: payload.location,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          gender: payload.gender,
          hourRate: user.role === 'find job' ? payload.hourRate : undefined,
          days: payload.days,
        },
      ],
      { session },
    );

    /* ---------- UPDATE USER ---------- */
    await User.findByIdAndUpdate(
      user._id,
      {
        $addToSet: {
          category: payload.categoryId,
          service: service[0]?._id,
        },
      },
      { session },
    );

    /* ---------- UPDATE CATEGORY ---------- */
    await Category.findByIdAndUpdate(
      payload.categoryId,
      user.role === 'find care'
        ? { $addToSet: { findCareUser: user._id } }
        : { $addToSet: { findJobUser: user._id } },
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return {
      service: service[0],
      checkoutUrl: checkoutSession?.url || null,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const serviceBaseUser = async (
  categoryId: string,
  params: any,
  options: IOption,
) => {
  const { searchTerm, minHourRate, maxHourRate, ...filters } = params;
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);

  // Check if category exists
  const category = await Category.findById(categoryId);
  if (!category) throw new AppError(404, 'Category not found');

  // Build match conditions
  const match: any = {
    'user.role': 'find job',
    categoryId: new mongoose.Types.ObjectId(categoryId),
  };

  // Search on user fields
  if (searchTerm) {
    match.$or = [
      { 'user.firstName': { $regex: searchTerm, $options: 'i' } },
      { 'user.lastName': { $regex: searchTerm, $options: 'i' } },
      { 'user.email': { $regex: searchTerm, $options: 'i' } },
    ];
  }

  // Exact filters
  for (const [key, value] of Object.entries(filters)) {
    match[`user.${key}`] = value;
  }

  // Filter by hourRate range
  if (minHourRate !== undefined || maxHourRate !== undefined) {
    match.hourRate = {};
    if (minHourRate !== undefined) match.hourRate.$gte = Number(minHourRate);
    if (maxHourRate !== undefined) match.hourRate.$lte = Number(maxHourRate);
  }

  const pipeline: mongoose.PipelineStage[] = [
    // Join with user collection
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },

    // Apply match conditions
    { $match: match },

    // Sort
    { $sort: { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 } },

    // Pagination
    { $skip: skip },
    { $limit: limit },

    // Select fields
    {
      $project: {
        location: 1,
        hourRate: 1,
        gender: 1,

        days: 1,
        status: 1,
        createdAt: 1,
        user: {
          firstName: 1,
          lastName: 1,
          email: 1,
          role: 1,
          profileImage: 1,
          _id: 1,
        },
      },
    },
  ];

  const data = await Service.aggregate(pipeline);

  // Get total count
  const totalResult = await Service.aggregate([
    ...pipeline.filter((stage) => !('$skip' in stage) && !('$limit' in stage)),
    { $count: 'total' },
  ]);
  const total = totalResult[0]?.total || 0;

  return {
    meta: { total, page, limit },
    data,
  };
};



/* ------------------- SINGLE USER SERVICE ------------------- */

const serviceUserBaseUser = async (
  userId: string,
  categoryId: string,
  params: any,
  options: IOption
) => {
  const { searchTerm, minHourRate, maxHourRate, ...filters } = params;
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);

  // ✅ 1. Logged-in user
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User is not found');

  // ✅ 2. Category check
  const category = await Category.findById(categoryId);
  if (!category) throw new AppError(404, 'Category not found');

  // ✅ 3. Opposite role logic
  let targetRole: string;

  if (user.role === 'find job') {
    targetRole = 'find care';
  } else if (user.role === 'find care') {
    targetRole = 'find job';
  } else {
    throw new AppError(400, 'Invalid user role');
  }

  // ✅ 4. Base match
  const match: any = {
    categoryId: new mongoose.Types.ObjectId(categoryId),
    'user.role': targetRole,
  };

  // ✅ 5. Search
  if (searchTerm) {
    match.$or = [
      { 'user.firstName': { $regex: searchTerm, $options: 'i' } },
      { 'user.lastName': { $regex: searchTerm, $options: 'i' } },
      { 'user.email': { $regex: searchTerm, $options: 'i' } },
    ];
  }

  // ✅ 6. Exact filters
  Object.entries(filters).forEach(([key, value]) => {
    match[`user.${key}`] = value;
  });

  // ✅ 7. Hour rate filter
  if (minHourRate !== undefined || maxHourRate !== undefined) {
    match.hourRate = {};

    if (minHourRate !== undefined) {
      match.hourRate.$gte = Number(minHourRate);
    }

    if (maxHourRate !== undefined) {
      match.hourRate.$lte = Number(maxHourRate);
    }
  }

  // ✅ 8. Aggregation pipeline
  const pipeline: mongoose.PipelineStage[] = [
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    { $match: match },
    {
      $sort: {
        [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1,
      },
    },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        location: 1,
        hourRate: 1,
        gender: 1,
        days: 1,
        status: 1,
        createdAt: 1,
        user: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          role: 1,
          profileImage: 1,
        },
      },
    },
  ];

  const data = await Service.aggregate(pipeline);

  // ✅ total count
  const totalResult = await Service.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    { $match: match },
    { $count: 'total' },
  ]);

  const total = totalResult[0]?.total || 0;

  return {
    meta: { total, page, limit },
    data,
  };
};

const singleUserService = async (userId: string) => {
  const result = await Service.findById(userId)
    .populate({
      path: 'userId',
      select: '-password -otp -otpExpiry',
      populate: {
        path: 'reviewRatting',
        populate: {
          path: 'userId',
          select: 'firstName lastName profileImage service',
        },
      },
    })
    .populate('categoryId')
    .lean();
  if (!result) throw new AppError(404, 'Service not found');
  return result;
};

const deleteService = async (userId: string) => {
  const result = await Service.findByIdAndDelete(userId);
  if (!result) throw new AppError(404, 'Service not found');
  return result;
};

export const serviceService = {
  registerServiceAndSubscription,
  serviceBaseUser,
  serviceUserBaseUser,
  singleUserService,
  deleteService,
};
