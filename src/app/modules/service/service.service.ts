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
import { getLocationFromZip } from '../../helper/geocode';

const stripe = new Stripe(config.stripe.secretKey!);

const registerServiceAndSubscription = async (
  payload: any,
  userId?: string,
) => {
  /* ================= GET OR CREATE USER ================= */
  let user = null;
  let geoData = null;

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

    /* ================= GEO FROM ZIP ================= */
    if (payload.zip) {
      geoData = await getLocationFromZip(payload.zip.toString());

      if (!geoData) {
        throw new AppError(400, 'Invalid zip code');
      }
    }

    user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        email: payload.email,
        password: payload.password || 'defaultpassword', // optional default
        firstName: payload.firstName,
        lastName: payload.lastName || '',
        role: payload.role,
        // location: payload.location || 1234,
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

          // ✅ auto from zip
          zip: payload.zip,
          location: geoData?.location,
          lat: geoData?.lat,
          lng: geoData?.lng,

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

    await User.findByIdAndUpdate(
      user._id,
      {
        location: geoData?.location,
        lat: geoData?.lat,
        lng: geoData?.lng,
        zip: payload.zip,
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

// const serviceBaseUser = async (
//   categoryId: string,
//   params: any,
//   options: IOption,
// ) => {
//   const { searchTerm, minHourRate, maxHourRate, ...filters } = params;

//   const { page, limit, skip, sortBy, sortOrder } = pagination(options);

//   // ✅ Check category
//   const category = await Category.findById(categoryId);
//   if (!category) throw new AppError(404, 'Category not found');

//   // ================= MATCH =================
//   const match: any = {
//     categoryId: new mongoose.Types.ObjectId(categoryId),
//     'user.role': 'find job',
//     'user.status': 'active',
//   };

//   // ================= SEARCH =================
//   if (searchTerm) {
//     match.$or = [
//       { 'user.firstName': { $regex: searchTerm, $options: 'i' } },
//       { 'user.lastName': { $regex: searchTerm, $options: 'i' } },
//       { 'user.email': { $regex: searchTerm, $options: 'i' } },
//       { 'user.location': { $regex: searchTerm, $options: 'i' } },
//       { 'user.bio': { $regex: searchTerm, $options: 'i' } },
//     ];
//   }

//   // ================= DYNAMIC FILTER =================
//   for (const [key, value] of Object.entries(filters)) {
//     if (!value) continue;

//     // Hour rate handled separately
//     if (key === 'minHourRate' || key === 'maxHourRate') continue;

//     // location: match Service.location OR user.location (partial match)
//     if (key === 'location') {
//       const locStr = String(value).trim();
//       if (locStr) {
//         match.$and = match.$and || [];
//         match.$and.push({
//           $or: [
//             { location: { $regex: locStr, $options: 'i' } },
//             { 'user.location': { $regex: locStr, $options: 'i' } },
//           ],
//         });
//       }
//       continue;
//     }

//     // Array fields (multi-select)
//     const arrayFields = [
//       'language',
//       'agegroup',
//       'education',
//       'canHelpWith',
//       'professionalSkill',
//       'perferences',
//     ];

//     if (arrayFields.includes(key)) {
//       match[`user.${key}`] = { $in: Array.isArray(value) ? value : [value] };
//     } else {
//       match[`user.${key}`] = value;
//     }
//   }

//   // ================= HOUR RATE RANGE =================
//   if (minHourRate || maxHourRate) {
//     match.hourRate = {};
//     if (minHourRate) match.hourRate.$gte = Number(minHourRate);
//     if (maxHourRate) match.hourRate.$lte = Number(maxHourRate);
//   }

//   // ================= PIPELINE =================
//   const pipeline: mongoose.PipelineStage[] = [
//     {
//       $lookup: {
//         from: 'users',
//         localField: 'userId',
//         foreignField: '_id',
//         as: 'user',
//       },
//     },
//     { $unwind: '$user' },

//     { $match: match },

//     {
//       $sort: {
//         [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1,
//       },
//     },

//     { $skip: skip },
//     { $limit: limit },

//     {
//       $project: {
//         zip: 1,
//         location: 1,
//         hourRate: 1,
//         gender: 1,
//         days: 1,
//         status: 1,
//         createdAt: 1,
//         user: {
//           _id: 1,
//           firstName: 1,
//           lastName: 1,
//           email: 1,
//           role: 1,
//           profileImage: 1,
//           bio: 1,
//           phone: 1,
//           gender: 1,
//           experienceLevel: 1,
//           location: 1,
//           language: 1,
//           agegroup: 1,
//           education: 1,
//           canHelpWith: 1,
//           professionalSkill: 1,
//           perferences: 1,
//         },
//       },
//     },
//   ];

//   const data = await Service.aggregate(pipeline);

//   // ================= TOTAL COUNT =================
//   const countPipeline = [
//     ...pipeline.filter(
//       (stage) =>
//         !('$skip' in stage) && !('$limit' in stage) && !('$sort' in stage),
//     ),
//     { $count: 'total' },
//   ];

//   const totalResult = await Service.aggregate(countPipeline);
//   const total = totalResult[0]?.total || 0;

//   return {
//     meta: { total, page, limit },
//     data,
//   };
// };

//==============================update code ===========================

const serviceBaseUser = async (
  categoryId: string,
  params: any,
  options: IOption,
) => {
  const { searchTerm, minHourRate, maxHourRate, role, ...filters } = params;
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);

  // ✅ Category check
  const category = await Category.findById(categoryId);
  if (!category) throw new AppError(404, 'Category not found');

  // ✅ Role validation
  if (!role) {
    throw new AppError(400, 'Role is required (find job | find care)');
  }

  // ================= MATCH =================
  const match: any = {
    categoryId: new mongoose.Types.ObjectId(categoryId),
    'user.role': role,
    'user.status': 'active',
    status: 'pending',
  };

  // ================= SEARCH =================
  if (searchTerm) {
    match.$or = [
      { 'user.firstName': { $regex: searchTerm, $options: 'i' } },
      { 'user.lastName': { $regex: searchTerm, $options: 'i' } },
      { 'user.email': { $regex: searchTerm, $options: 'i' } },
      { 'user.location': { $regex: searchTerm, $options: 'i' } },
      { 'user.bio': { $regex: searchTerm, $options: 'i' } },
    ];
  }

  // ================= DYNAMIC FILTER =================
  const arrayFields = [
    'language',
    'agegroup',
    'education',
    'canHelpWith',
    'professionalSkill',
    'perferences',
  ];

  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;
    if (key === 'minHourRate' || key === 'maxHourRate') return;

    // 🔹 location filter (service OR user)
    if (key === 'location') {
      const locStr = String(value).trim();
      if (locStr) {
        match.$and = match.$and || [];
        match.$and.push({
          $or: [
            { location: { $regex: locStr, $options: 'i' } },
            { 'user.location': { $regex: locStr, $options: 'i' } },
          ],
        });
      }
      return;
    }

    // 🔹 array filters
    if (arrayFields.includes(key)) {
      match[`user.${key}`] = {
        $in: Array.isArray(value) ? value : [value],
      };
    } else {
      match[`user.${key}`] = value;
    }
  });

  // ================= HOUR RATE =================
  if (minHourRate || maxHourRate) {
    match.hourRate = {};
    if (minHourRate) match.hourRate.$gte = Number(minHourRate);
    if (maxHourRate) match.hourRate.$lte = Number(maxHourRate);
  }

  // ================= BASE PIPELINE =================
  const basePipeline: mongoose.PipelineStage[] = [
    // 🔹 join user
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },

    // 🔹 join category (✅ NEW)
    {
      $lookup: {
        from: 'categories', // ⚠️ ensure your collection name
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },

    // 🔹 match
    { $match: match },
  ];

  // ================= DATA PIPELINE =================
  const dataPipeline: mongoose.PipelineStage[] = [
    ...basePipeline,

    // 🔹 join reviews
    {
      $lookup: {
        from: 'reviews',
        localField: 'user._id',
        foreignField: 'jobUserId',
        as: 'reviews',
      },
    },

    // 🔹 rating calculation
    {
      $addFields: {
        averageRating: {
          $cond: [
            { $gt: [{ $size: '$reviews' }, 0] },
            { $avg: '$reviews.ratting' },
            0,
          ],
        },
        totalRatings: { $size: '$reviews' },
      },
    },

    // 🔹 sorting
    {
      $sort: {
        [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1,
      },
    },

    { $skip: skip },
    { $limit: limit },

    // 🔹 projection
    {
      $project: {
        location: 1,
        hourRate: 1,
        gender: 1,
        days: 1,
        status: 1,
        createdAt: 1,
        averageRating: { $round: ['$averageRating', 1] },
        totalRatings: 1,

        // ✅ category populated
        category: {
          _id: '$category._id',
          name: '$category.name',
          description: '$category.description',
          banner: '$category.banner',
          logo: '$category.image',
        },

        user: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          role: 1,
          profileImage: 1,
          bio: 1,
          phone: 1,
          gender: 1,
          experienceLevel: 1,
          location: 1,
          language: 1,
          agegroup: 1,
          education: 1,
          canHelpWith: 1,
          professionalSkill: 1,
          perferences: 1,
        },
      },
    },
  ];

  const data = await Service.aggregate(dataPipeline);

  // ================= COUNT =================
  const totalResult = await Service.aggregate([
    ...basePipeline,
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
  options: IOption,
) => {
  const { searchTerm, minHourRate, maxHourRate, ...filters } = params;
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);

  // Logged-in user
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User is not found');

  // Category check
  const category = await Category.findById(categoryId);
  if (!category) throw new AppError(404, 'Category not found');

  // Opposite role
  let targetRole: string;
  if (user.role === 'find job') targetRole = 'find care';
  else if (user.role === 'find care') targetRole = 'find job';
  else throw new AppError(400, 'Invalid user role');

  // ================= MATCH =================
  const match: any = {
    categoryId: new mongoose.Types.ObjectId(categoryId),
    'user.role': targetRole,
    'user.status': 'active',
    status: 'pending', // only available services
  };

  // ================= SEARCH =================
  if (searchTerm) {
    match.$or = [
      { 'user.firstName': { $regex: searchTerm, $options: 'i' } },
      { 'user.lastName': { $regex: searchTerm, $options: 'i' } },
      { 'user.email': { $regex: searchTerm, $options: 'i' } },
      { 'user.location': { $regex: searchTerm, $options: 'i' } },
      { 'user.bio': { $regex: searchTerm, $options: 'i' } },
    ];
  }

  // ================= DYNAMIC FILTER =================
  const arrayFields = [
    'language',
    'agegroup',
    'education',
    'canHelpWith',
    'professionalSkill',
    'perferences',
  ];

  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;

    // skip hourRate (handled later)
    if (key === 'minHourRate' || key === 'maxHourRate') return;

    // location: match Service.location OR user.location (partial match)
    if (key === 'location') {
      const locStr = String(value).trim();
      if (locStr) {
        match.$and = match.$and || [];
        match.$and.push({
          $or: [
            { location: { $regex: locStr, $options: 'i' } },
            { 'user.location': { $regex: locStr, $options: 'i' } },
          ],
        });
      }
      return;
    }

    // array filter
    if (arrayFields.includes(key)) {
      match[`user.${key}`] = {
        $in: Array.isArray(value) ? value : [value],
      };
    } else {
      match[`user.${key}`] = value;
    }
  });

  // ================= HOUR RATE =================
  if (minHourRate || maxHourRate) {
    match.hourRate = {};
    if (minHourRate) match.hourRate.$gte = Number(minHourRate);
    if (maxHourRate) match.hourRate.$lte = Number(maxHourRate);
  }

  // ================= PIPELINE =================
  const basePipeline: mongoose.PipelineStage[] = [
    // join user
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
  ];

  const dataPipeline: mongoose.PipelineStage[] = [
    ...basePipeline,

    // join reviews
    {
      $lookup: {
        from: 'reviews',
        localField: 'user._id',
        foreignField: 'jobUserId',
        as: 'reviews',
      },
    },

    // calculate avg + total rating
    {
      $addFields: {
        averageRating: {
          $cond: [
            { $gt: [{ $size: '$reviews' }, 0] },
            { $avg: '$reviews.ratting' },
            0,
          ],
        },
        totalRatings: { $size: '$reviews' },
      },
    },

    // sorting
    {
      $sort: {
        [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1,
      },
    },
    { $skip: skip },
    { $limit: limit },

    // final projection
    {
      $project: {
        location: 1,
        hourRate: 1,
        gender: 1,
        days: 1,
        status: 1,
        createdAt: 1,
        averageRating: { $round: ['$averageRating', 1] },
        totalRatings: 1,
        user: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          role: 1,
          profileImage: 1,
          bio: 1,
          phone: 1,
          gender: 1,
          experienceLevel: 1,
          location: 1,
          language: 1,
          agegroup: 1,
          education: 1,
          canHelpWith: 1,
          professionalSkill: 1,
          perferences: 1,
        },
      },
    },
  ];

  const data = await Service.aggregate(dataPipeline);

  // ================= COUNT =================
  const totalResult = await Service.aggregate([
    ...basePipeline,
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

const getAllServiceLocations = async (query: any, userId?: string) => {
  const { searchTerm, limit, categoryId } = query;

  const match: any = {};

  if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
    match.categoryId = new mongoose.Types.ObjectId(categoryId);
  } else if (userId) {
    const user = await User.findById(userId).select('category');

    if (user?.category?.length) {
      match.categoryId = { $in: user.category };
    }
  }

  if (searchTerm) {
    match.location = {
      $exists: true,
      $nin: [null, ''],
      $regex: searchTerm,
      $options: 'i',
    };
  } else {
    match.location = {
      $exists: true,
      $nin: [null, ''],
    };
  }

  const pipeline: any[] = [
    { $match: match },
    {
      $group: {
        _id: '$location',
        location: { $first: '$location' },
        zip: { $first: '$zip' },
        lat: { $first: '$lat' },
        lng: { $first: '$lng' },
        totalServices: { $sum: 1 },
      },
    },
    { $sort: { location: 1 } },
  ];

  if (limit) {
    pipeline.push({ $limit: Number(limit) });
  }

  const data = await Service.aggregate(pipeline);

  return data;
};

export const serviceService = {
  registerServiceAndSubscription,
  serviceBaseUser,
  serviceUserBaseUser,
  singleUserService,
  deleteService,
  getAllServiceLocations,
};
