//=============================== update code =======================================
import Booking from './booking.model';
import AppError from '../../error/appError';
import Service from '../service/service.model';
import User from '../user/user.model';
import Payment from '../payment/payment.model';
import pagination, { IOption } from '../../helper/pagenation';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import config from '../../config';

// const stripe = new Stripe(config.stripe.secretKey!);

// // ===================== Helper: Validate Date Format =====================
// const isValidDate = (dateString: string): boolean => {
//   const date = new Date(dateString);
//   return date instanceof Date && !isNaN(date.getTime());
// };

// // ===================== Helper: Check Time Slot Availability =====================
// const isSlotAvailable = async (
//   serviceId: string,
//   day: string,
//   date: string,
//   time: string,
//   excludeBookingId?: string,
// ): Promise<boolean> => {
//   const query: any = {
//     serviceId,
//     day,
//     date,
//     time,
//     status: { $in: ['pending', 'accepted'] }, // Only active bookings block slots
//   };

//   // Exclude current booking when updating
//   if (excludeBookingId) {
//     query._id = { $ne: excludeBookingId };
//   }

//   const conflict = await Booking.findOne(query);
//   return !conflict;
// };

// // ===================== Helper: Validate Day and Date Match =====================
// const validateDayAndDate = (day: string, date: string): void => {
//   const bookingDate = new Date(date);
//   const weekDays = [
//     'Sunday',
//     'Monday',
//     'Tuesday',
//     'Wednesday',
//     'Thursday',
//     'Friday',
//     'Saturday',
//   ];
//   const actualDay = weekDays[bookingDate.getDay()];

//   if (actualDay !== day) {
//     throw new AppError(
//       400,
//       `Date does not match selected day. ${date} is ${actualDay}, not ${day}`,
//     );
//   }
// };

// // ===================== Helper: Validate Booking Date (Not in Past) =====================
// const validateBookingDate = (date: string): void => {
//   const bookingDate = new Date(date);
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   if (bookingDate < today) {
//     throw new AppError(400, 'Cannot book for past dates');
//   }
// };

// //=====================================update code====================================
// const createBooking = async (payload: {
//   serviceId: string;
//   day: string;
//   date: string;
//   time: string;
//   userId: string;
// }) => {
//   // ================= DATE VALIDATION =================
//   if (!isValidDate(payload.date)) {
//     throw new AppError(400, 'Invalid date format. Use YYYY-MM-DD');
//   }

//   validateBookingDate(payload.date);
//   validateDayAndDate(payload.day, payload.date);

//   // ================= OBJECT ID VALIDATION =================
//   if (!mongoose.Types.ObjectId.isValid(payload.serviceId)) {
//     throw new AppError(400, 'Invalid service ID');
//   }

//   // ================= USER CHECK =================
//   const user = await User.findById(payload.userId);
//   if (!user) throw new AppError(404, 'User not found');

//   if (!user.isSubscription) {
//     throw new AppError(403, 'You need to subscribe to find care');
//   }

//   if (user.role !== 'find care') {
//     throw new AppError(403, 'Only users looking for care can create bookings');
//   }

//   // ================= SERVICE CHECK =================
//   const service = await Service.findById(payload.serviceId)
//     .populate('userId')
//     .lean();

//   if (!service) throw new AppError(404, 'Service not found');
//   if (!service.categoryId)
//     throw new AppError(400, 'Service category not found');

//   // Prevent self booking
//   const provider: any = service.userId;
//   if (provider._id.toString() === payload.userId) {
//     throw new AppError(400, 'You cannot book your own service');
//   }

//   // ================= DAY VALIDATION (FIXED) =================
//   const daySlot = service.days?.find((d: any) => d.day === payload.day);

//   if (!daySlot) {
//     throw new AppError(400, `Service is not available on ${payload.day}`);
//   }

//   // ================= TIME VALIDATION (FIXED) =================
//   const isTimeInRange =
//     payload.time >= daySlot.startTime && payload.time <= daySlot.endTime;

//   if (!isTimeInRange) {
//     throw new AppError(400, `Service is not available at ${payload.time}`);
//   }

//   // ================= SLOT CHECK =================
//   const available = await isSlotAvailable(
//     payload.serviceId,
//     payload.day,
//     payload.date,
//     payload.time,
//   );

//   if (!available) {
//     throw new AppError(
//       409,
//       'This time slot is already booked for the selected date',
//     );
//   }

//   // ================= PROVIDER CHECK =================
//   if (!provider.stripeAccountId) {
//     throw new AppError(400, 'Service provider has not completed Stripe setup');
//   }

//   // ================= PAYMENT CALCULATION =================
//   const hourRate = service.hourRate || 0;
//   const totalAmountCents = Math.round(hourRate * 100);
//   const adminFeeCents = Math.round(totalAmountCents * 0.1);
//   const providerAmountCents = totalAmountCents - adminFeeCents;

//   // ================= TRANSACTION START =================
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // ================= STRIPE SESSION =================
//     const checkoutSession = await stripe.checkout.sessions.create({
//       mode: 'payment',
//       payment_method_types: ['card'],
//       customer_email: user.email,
//       line_items: [
//         {
//           price_data: {
//             currency: 'usd',
//             unit_amount: totalAmountCents,
//             product_data: {
//               name: `Booking: ${service.firstName} ${service.lastName}`,
//               description: `${payload.day}, ${payload.date} at ${payload.time}`,
//             },
//           },
//           quantity: 1,
//         },
//       ],
//       payment_intent_data: {
//         application_fee_amount: adminFeeCents,
//         transfer_data: {
//           destination: provider.stripeAccountId,
//         },
//       },
//       success_url: `${config.frontendUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${config.frontendUrl}/booking-cancel`,
//       metadata: {
//         userId: payload.userId,
//         serviceId: payload.serviceId,
//         serviceProviderId: provider._id.toString(),
//         day: payload.day,
//         date: payload.date,
//         time: payload.time,
//         paymentType: 'booking',
//         totalAmount: totalAmountCents.toString(),
//         adminFee: adminFeeCents.toString(),
//         providerAmount: providerAmountCents.toString(),
//       },
//     });

//     // ================= CREATE BOOKING =================
//     const [createdBooking] = await Booking.create(
//       [
//         {
//           serviceId: service._id,
//           categoryId: service.categoryId,
//           userId: payload.userId,
//           day: payload.day,
//           date: payload.date,
//           time: payload.time,
//           location: service.location,
//           status: 'pending',
//         },
//       ],
//       { session },
//     );

//     if (!createdBooking) {
//       throw new AppError(500, 'Failed to create booking');
//     }

//     // ================= CREATE PAYMENT =================
//     await Payment.create(
//       [
//         {
//           user: payload.userId,
//           service: service._id,
//           booking: createdBooking._id,
//           category: service.categoryId,
//           stripeSessionId: checkoutSession.id,
//           amount: hourRate,
//           currency: 'usd',
//           status: 'pending',
//           paymentType: 'booking',
//           userType: 'findCare',
//           adminFree: adminFeeCents / 100,
//           serviceProviderFree: providerAmountCents / 100,
//         },
//       ],
//       { session },
//     );

//     // ================= UPDATE USER =================
//     user.totalBooking = user.totalBooking || [];
//     user.totalBooking.push(createdBooking._id);
//     await user.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     return {
//       booking: createdBooking,
//       checkoutUrl: checkoutSession.url,
//       sessionId: checkoutSession.id,
//     };
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
// };

const stripe = new Stripe(config.stripe.secretKey!);

// ===================== Helper: Validate Date Format =====================
const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// ===================== Helper: Validate Day and Date Match =====================
const normalizeDay = (d: string) => (d || '').trim().toLowerCase();

const validateDayAndDate = (day: string, date: string): void => {
  const bookingDate = new Date(date);
  const weekDays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const actualDay = weekDays[bookingDate.getDay()] || '';

  if (normalizeDay(actualDay) !== normalizeDay(day)) {
    throw new AppError(
      400,
      `Date does not match selected day. ${date} is ${actualDay}, not ${day}`,
    );
  }
};

// ===================== Helper: Validate Booking Date (Not in Past) =====================
const validateBookingDate = (date: string): void => {
  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (bookingDate < today) {
    throw new AppError(400, 'Cannot book for past dates');
  }
};

// ===================== Helper: Time Parser (supports 24h + am/pm) =====================
const parseTimeToMinutes = (input: string): number | null => {
  if (!input) return null;

  const s = input.trim().toLowerCase().replace(/\s+/g, '');

  // 1) HH:mm (24h) e.g. "11:30"
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = Number(m24[1]);
    const m = Number(m24[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return h * 60 + m;
    return null;
  }

  // 2) H(am/pm) or H:mm(am/pm) e.g. "5am", "2pm", "2:30pm"
  const m12 = s.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (m12) {
    let h = Number(m12[1]);
    const m = m12[2] ? Number(m12[2]) : 0;
    const ap = m12[3];

    if (h < 1 || h > 12 || m < 0 || m > 59) return null;

    if (ap === 'am') {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h = h + 12;
    }
    return h * 60 + m;
  }

  return null;
};

const isTimeWithinRange = (time: string, start: string, end: string) => {
  const t = parseTimeToMinutes(time);
  const s = parseTimeToMinutes(start);
  const e = parseTimeToMinutes(end);

  if (t === null || s === null || e === null) return false;

  // normal range
  if (s <= e) return t >= s && t <= e;

  // overnight range support
  return t >= s || t <= e;
};

// ===================== Helper: Check Time Slot Availability =====================
const isSlotAvailable = async (
  serviceId: string,
  day: string,
  date: string,
  time: string,
  excludeBookingId?: string,
): Promise<boolean> => {
  const query: any = {
    serviceId,
    day,
    date,
    time,
    status: { $in: ['pending', 'accepted'] },
  };

  if (excludeBookingId) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeBookingId) };
  }

  const conflict = await Booking.findOne(query);
  return !conflict;
};

// ===================== Create Booking (FIXED) =====================
const createBooking = async (payload: {
  serviceId: string;
  day: string;
  date: string;
  time: string;
  userId: string;
}) => {
  // DATE VALIDATION
  if (!isValidDate(payload.date)) {
    throw new AppError(400, 'Invalid date format. Use YYYY-MM-DD');
  }
  validateBookingDate(payload.date);
  validateDayAndDate(payload.day, payload.date);

  // OBJECT ID VALIDATION
  if (!mongoose.Types.ObjectId.isValid(payload.serviceId)) {
    throw new AppError(400, 'Invalid service ID');
  }

  // USER CHECK
  const user = await User.findById(payload.userId);
  if (!user) throw new AppError(404, 'User not found');

  // ✅ subscription validity check (boolean + expiry)
  const now = new Date();
  const hasActiveSubscription =
    user.isSubscription &&
    user.subscriptionExpiry &&
    user.subscriptionExpiry > now;

  if (!hasActiveSubscription) {
    throw new AppError(403, 'You need an active subscription to book');
  }

  if (user.role !== 'find care') {
    throw new AppError(403, 'Only find care users can create bookings');
  }

  // SERVICE CHECK
  const service = await Service.findById(payload.serviceId)
    .populate('userId')
    .lean();

  if (!service) throw new AppError(404, 'Service not found');
  if (!service.categoryId)
    throw new AppError(400, 'Service category not found');

  const provider: any = service.userId;

  // Find care books services offered by find job (service provider) users only
  const providerRole = String(provider?.role ?? '')
    .toLowerCase()
    .trim();
  if (providerRole !== 'find job') {
    throw new AppError(
      400,
      'Bookings are only available for find job service providers',
    );
  }

  // Prevent self booking
  if (provider?._id?.toString() === payload.userId) {
    throw new AppError(400, 'You cannot book your own service');
  }

  // DAY SLOT CHECK ✅
  const daySlot = (service.days || []).find(
    (d: any) => normalizeDay(d.day) === normalizeDay(payload.day),
  );

  if (!daySlot) {
    throw new AppError(400, `Service is not available on ${payload.day}`);
  }

  // TIME RANGE CHECK ✅
  const ok = isTimeWithinRange(
    payload.time,
    daySlot.startTime,
    daySlot.endTime,
  );
  if (!ok) {
    throw new AppError(
      400,
      `Service is available ${daySlot.startTime} - ${daySlot.endTime} on ${payload.day}`,
    );
  }

  // SLOT CHECK ✅
  const available = await isSlotAvailable(
    payload.serviceId,
    payload.day,
    payload.date,
    payload.time,
  );
  if (!available) {
    throw new AppError(409, 'This time slot is already booked for that date');
  }

  // PROVIDER STRIPE CHECK ✅
  if (!provider?.stripeAccountId) {
    throw new AppError(400, 'Service provider has not completed Stripe setup');
  }

  // PAYMENT CALC ✅
  const hourRate = Number(service.hourRate || 0);
  if (hourRate <= 0) {
    throw new AppError(400, 'Service hourRate is not set');
  }

  const totalAmountCents = Math.round(hourRate * 100);
  const adminFeeCents = Math.round(totalAmountCents * 0.1);
  const providerAmountCents = totalAmountCents - adminFeeCents;

  const platformOnlyCheckout =
    config.stripe.bookingPlatformOnlyCheckout === true;

  // TRANSACTION ✅
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sessionCreateParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: totalAmountCents,
            product_data: {
              name: `Booking: ${service.firstName} ${service.lastName}`,
              description: `${payload.day}, ${payload.date} at ${payload.time}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: config.stripeCheckoutUrls.bookingSuccessUrl,
      cancel_url: config.stripeCheckoutUrls.bookingCancelUrl,
      metadata: {
        userId: payload.userId,
        serviceId: payload.serviceId,
        serviceProviderId: provider._id.toString(),
        day: payload.day,
        date: payload.date,
        time: payload.time,
        paymentType: 'booking',
        totalAmount: totalAmountCents.toString(),
        adminFee: adminFeeCents.toString(),
        providerAmount: providerAmountCents.toString(),
        ...(platformOnlyCheckout ? { connectTransfer: 'skipped_dev' } : {}),
      },
    };

    if (!platformOnlyCheckout) {
      sessionCreateParams.payment_intent_data = {
        application_fee_amount: adminFeeCents,
        transfer_data: { destination: provider.stripeAccountId },
      };
    }

    let checkoutSession: Stripe.Checkout.Session;
    try {
      checkoutSession = await stripe.checkout.sessions.create(
        sessionCreateParams,
      );
    } catch (err: unknown) {
      const stripeErr = err as {
        type?: string;
        message?: string;
        raw?: { message?: string };
      };
      const rawMsg = String(
        stripeErr.raw?.message ?? stripeErr.message ?? '',
      ).toLowerCase();
      if (
        stripeErr.type === 'StripeInvalidRequestError' &&
        (rawMsg.includes('destination') ||
          rawMsg.includes('capabilities') ||
          rawMsg.includes('transfers') ||
          rawMsg.includes('legacy_payments'))
      ) {
        throw new AppError(
          400,
          'This provider’s Stripe account is not ready to receive payouts (Connect transfers not active). They must finish Stripe Connect onboarding in the Stripe Dashboard. For local testing, add BOOKING_PLATFORM_ONLY_CHECKOUT=true to your server .env.',
        );
      }
      throw err;
    }

    const [createdBooking] = await Booking.create(
      [
        {
          serviceId: service._id,
          categoryId: service.categoryId,
          userId: payload.userId,
          day: payload.day,
          date: payload.date,
          time: payload.time,
          location: service.location,
          status: 'pending', // webhook success -> accepted
        },
      ],
      { session },
    );

    await Payment.create(
      [
        {
          user: payload.userId,
          service: service._id,
          booking: createdBooking!._id,
          category: service.categoryId,
          stripeSessionId: checkoutSession.id,
          amount: hourRate,
          currency: 'usd',
          status: 'pending',
          paymentType: 'booking',
          userType: 'findCare',
          adminFree: adminFeeCents / 100,
          serviceProviderFree: providerAmountCents / 100,
        },
      ],
      { session },
    );

    user.totalBooking = user.totalBooking || [];
    user.totalBooking.push(createdBooking!._id);
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      booking: createdBooking,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    };
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
};

// ===================== Update Booking (FIXED SLOT VALIDATION) =====================
const updateBooking = async (id: string, payload: any, userId?: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, 'Invalid booking ID');
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const booking = await Booking.findById(id).populate({
    path: 'serviceId',
    select: 'userId days',
  });

  if (!booking) throw new AppError(404, 'Booking not found');

  // Authorization
  if (user.role !== 'admin') {
    const isBookingOwner = booking.userId.toString() === userId;
    const isServiceProvider =
      (booking.serviceId as any).userId?.toString() === userId;

    if (!isBookingOwner && !isServiceProvider) {
      throw new AppError(
        403,
        'You do not have permission to update this booking',
      );
    }

    // Provider can only update status
    if (isServiceProvider && !isBookingOwner) {
      const allowedFields = ['status'];
      const hasInvalidField = Object.keys(payload).some(
        (key) => !allowedFields.includes(key),
      );
      if (hasInvalidField) {
        throw new AppError(
          403,
          'Service providers can only update booking status',
        );
      }
    }
  }

  if (['completed', 'cancelled'].includes(booking.status)) {
    throw new AppError(400, `Cannot update ${booking.status} booking`);
  }

  // ✅ If updating slot: re-validate day/date/time properly
  if (payload.day || payload.date || payload.time) {
    const newDay = payload.day || booking.day;
    const newDate = payload.date || booking.date;
    const newTime = payload.time || booking.time;

    if (payload.date && !isValidDate(payload.date)) {
      throw new AppError(400, 'Invalid date format. Use YYYY-MM-DD');
    }
    if (payload.date) validateBookingDate(payload.date);

    validateDayAndDate(newDay, newDate);

    const serviceDoc: any = booking.serviceId; // populated partial service (days)
    const daySlot = (serviceDoc?.days || []).find(
      (d: any) => normalizeDay(d.day) === normalizeDay(newDay),
    );

    if (!daySlot) {
      throw new AppError(400, `Service is not available on ${newDay}`);
    }

    const ok = isTimeWithinRange(newTime, daySlot.startTime, daySlot.endTime);
    if (!ok) {
      throw new AppError(
        400,
        `Service is available ${daySlot.startTime} - ${daySlot.endTime} on ${newDay}`,
      );
    }

    const serviceIdString = serviceDoc?._id?.toString();
    const available = await isSlotAvailable(
      serviceIdString,
      newDay,
      newDate,
      newTime,
      id, // exclude this booking
    );
    if (!available) {
      throw new AppError(409, 'This time slot is already booked');
    }
  }

  // Status transition validation (keep your logic)
  if (payload.status) {
    const validTransitions: { [key: string]: string[] } = {
      pending: ['accepted', 'cancelled'],
      accepted: ['completed', 'cancelled'],
    };

    const allowedStatuses = validTransitions[booking.status] || [];
    if (!allowedStatuses.includes(payload.status)) {
      throw new AppError(
        400,
        `Cannot change status from ${booking.status} to ${payload.status}`,
      );
    }
  }

  const updatedBooking = await Booking.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  })
    .populate({
      path: 'userId',
      select: 'firstName lastName email phone profileImage',
    })
    .populate({
      path: 'serviceId',
      select: 'firstName lastName email location hourRate',
    })
    .populate({
      path: 'categoryId',
      select: 'name',
    });

  return updatedBooking;
};

// ===================== Get All Bookings (Admin) =====================
const getAllBooking = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, status, date, day, userId, serviceId, ...filterData } =
    params;

  const andCondition: any[] = [];

  // Search functionality
  if (searchTerm) {
    andCondition.push({
      $or: [
        { day: { $regex: searchTerm, $options: 'i' } },
        { date: { $regex: searchTerm, $options: 'i' } },
        { time: { $regex: searchTerm, $options: 'i' } },
        { location: { $regex: searchTerm, $options: 'i' } },
      ],
    });
  }

  // Filter by status
  if (status) {
    andCondition.push({ status });
  }

  // Filter by date
  if (date) {
    andCondition.push({ date });
  }

  // Filter by day
  if (day) {
    andCondition.push({ day });
  }

  // Filter by userId
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    andCondition.push({ userId: new mongoose.Types.ObjectId(userId) });
  }

  // Filter by serviceId
  if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
    andCondition.push({ serviceId: new mongoose.Types.ObjectId(serviceId) });
  }

  // Other filters
  if (Object.keys(filterData).length) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const result = await Booking.find(whereCondition)
    .populate({
      path: 'userId',
      select: 'firstName lastName email phone profileImage role',
    })
    .populate({
      path: 'serviceId',
      select: 'firstName lastName email location hourRate gender days',
    })
    .populate({
      path: 'categoryId',
      select: 'name',
    })
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Booking.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

// ===================== Get My Bookings (User) =====================
const getAllMyBooking = async (
  userId: string,
  params: any,
  options: IOption,
) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, status, date, upcoming, ...filterData } = params;

  const andCondition: any[] = [{ userId }];

  // Search functionality
  if (searchTerm) {
    andCondition.push({
      $or: [
        { day: { $regex: searchTerm, $options: 'i' } },
        { time: { $regex: searchTerm, $options: 'i' } },
        { location: { $regex: searchTerm, $options: 'i' } },
      ],
    });
  }

  // Filter by status
  if (status) {
    andCondition.push({ status });
  }

  // Filter by date
  if (date) {
    andCondition.push({ date });
  }

  // Filter upcoming bookings
  if (upcoming === 'true') {
    const today = new Date().toISOString().slice(0, 10);
    andCondition.push({ date: { $gte: today } });
  }

  // Other filters
  if (Object.keys(filterData).length) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const result = await Booking.find(whereCondition)
    .populate({
      path: 'serviceId',
      select: 'firstName lastName email location hourRate gender days',
      populate: {
        path: 'userId',
        select: 'firstName lastName email phone profileImage',
      },
    })
    .populate({
      path: 'categoryId',
      select: 'name',
    })
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Booking.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

// ===================== Get Bookings for Service Provider =====================
const getMyServiceBookings = async (
  userId: string,
  params: any,
  options: IOption,
) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, status, date, upcoming, ...filterData } = params;

  // Find all services of this user
  const services = await Service.find({ userId });
  const serviceIds = services.map((s) => s._id);

  if (serviceIds.length === 0) {
    return {
      data: [],
      meta: { total: 0, page, limit },
    };
  }

  const andCondition: any[] = [{ serviceId: { $in: serviceIds } }];

  // Search functionality
  if (searchTerm) {
    andCondition.push({
      $or: [
        { day: { $regex: searchTerm, $options: 'i' } },
        { time: { $regex: searchTerm, $options: 'i' } },
        { location: { $regex: searchTerm, $options: 'i' } },
      ],
    });
  }

  // Filter by status
  if (status) {
    andCondition.push({ status });
  }

  // Filter by date
  if (date) {
    andCondition.push({ date });
  }

  // Filter upcoming bookings
  if (upcoming === 'true') {
    const today = new Date().toISOString().slice(0, 10);
    andCondition.push({ date: { $gte: today } });
  }

  // Other filters
  if (Object.keys(filterData).length) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const result = await Booking.find(whereCondition)
    .populate({
      path: 'userId',
      select: 'firstName lastName email phone profileImage',
    })
    .populate({
      path: 'serviceId',
      select: 'firstName lastName location hourRate',
    })
    .populate({
      path: 'categoryId',
      select: 'name',
    })
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Booking.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

// ===================== Get Single Booking =====================
const getSingleBooking = async (id: string, userId?: string, role?: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, 'Invalid booking ID');
  }

  const booking = await Booking.findById(id)
    .populate({
      path: 'userId',
      select: 'firstName lastName email phone profileImage role',
    })
    .populate({
      path: 'serviceId',
      select: 'firstName lastName email location hourRate gender days userId',
      populate: {
        path: 'userId',
        select: 'firstName lastName email phone profileImage',
      },
    })
    .populate({
      path: 'categoryId',
      select: 'name',
    });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  // Authorization check
  if (role !== 'admin' && userId) {
    const isBookingOwner = booking.userId._id.toString() === userId;
    const isServiceProvider =
      (booking.serviceId as any).userId?._id.toString() === userId;

    if (!isBookingOwner && !isServiceProvider) {
      throw new AppError(
        403,
        'You do not have permission to view this booking',
      );
    }
  }

  return booking;
};

// // ===================== Update Booking =====================
// const updateBooking = async (id: string, payload: any, userId?: string) => {
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     throw new AppError(400, 'Invalid booking ID');
//   }

//   const user = await User.findById(userId);
//   if (!user) {
//     throw new AppError(404, 'User not found');
//   }

//   const booking = await Booking.findById(id).populate({
//     path: 'serviceId',
//     select: 'userId days',
//   });

//   if (!booking) {
//     throw new AppError(404, 'Booking not found');
//   }

//   // Authorization check
//   if (user.role !== 'admin') {
//     const isBookingOwner = booking.userId.toString() === userId;
//     const isServiceProvider =
//       (booking.serviceId as any).userId?.toString() === userId;

//     if (!isBookingOwner && !isServiceProvider) {
//       throw new AppError(
//         403,
//         'You do not have permission to update this booking',
//       );
//     }

//     // Service provider can only update status to accept or complete
//     if (isServiceProvider && !isBookingOwner) {
//       const allowedFields = ['status'];
//       const hasInvalidField = Object.keys(payload).some(
//         (key) => !allowedFields.includes(key),
//       );
//       if (hasInvalidField) {
//         throw new AppError(
//           403,
//           'Service providers can only update booking status',
//         );
//       }
//     }
//   }

//   // Prevent updating completed or cancelled bookings
//   if (['completed', 'cancelled'].includes(booking.status)) {
//     throw new AppError(400, `Cannot update ${booking.status} booking`);
//   }

//   // If updating time slot, validate availability
//   if (payload.day || payload.date || payload.time) {
//     const day = payload.day || booking.day;
//     const date = payload.date || booking.date;
//     const time = payload.time || booking.time;

//     // Validate date format
//     if (payload.date && !isValidDate(payload.date)) {
//       throw new AppError(400, 'Invalid date format. Use YYYY-MM-DD');
//     }

//     // Validate booking date
//     if (payload.date) {
//       validateBookingDate(payload.date);
//     }

//     // Validate day and date match
//     validateDayAndDate(day, date);

//     // Check service availability for new slot
//     const service = booking.serviceId as any;
//     if (payload.day && !service?.days?.day?.includes(payload.day)) {
//       throw new AppError(400, 'Service is not available on this day');
//     }
//     if (payload.time && !service?.days?.time?.includes(payload.time)) {
//       throw new AppError(400, 'Service is not available at this time');
//     }

//     // Check slot availability - use _id from populated service
//     const serviceIdString = (booking.serviceId as any)._id.toString();
//     const available = await isSlotAvailable(
//       serviceIdString,
//       day,
//       date,
//       time,
//       id, // Exclude current booking
//     );

//     if (!available) {
//       throw new AppError(409, 'This time slot is already booked');
//     }
//   }

//   // Status transition validation
//   if (payload.status) {
//     const validTransitions: { [key: string]: string[] } = {
//       pending: ['accepted', 'cancelled'], // After payment, service provider can accept
//       accepted: ['completed', 'cancelled'], // Service provider or user can complete
//     };

//     const allowedStatuses = validTransitions[booking.status] || [];
//     if (!allowedStatuses.includes(payload.status)) {
//       throw new AppError(
//         400,
//         `Cannot change status from ${booking.status} to ${payload.status}`,
//       );
//     }

//     // Update user's booking arrays based on status
//     if (payload.status === 'completed') {
//       const bookingUser = await User.findById(booking.userId);
//       if (bookingUser) {
//         bookingUser.completeBooking = bookingUser.completeBooking || [];
//         if (!bookingUser.completeBooking.includes(booking._id)) {
//           bookingUser.completeBooking.push(booking._id);
//           await bookingUser.save();
//         }
//       }
//     }

//     if (payload.status === 'cancelled') {
//       const bookingUser = await User.findById(booking.userId);
//       if (bookingUser) {
//         bookingUser.cencleBooking = bookingUser.cencleBooking || [];
//         if (!bookingUser.cencleBooking.includes(booking._id)) {
//           bookingUser.cencleBooking.push(booking._id);
//           await bookingUser.save();
//         }
//       }
//     }
//   }

//   const updatedBooking = await Booking.findByIdAndUpdate(id, payload, {
//     new: true,
//     runValidators: true,
//   })
//     .populate({
//       path: 'userId',
//       select: 'firstName lastName email phone profileImage',
//     })
//     .populate({
//       path: 'serviceId',
//       select: 'firstName lastName email location hourRate',
//     })
//     .populate({
//       path: 'categoryId',
//       select: 'name',
//     });

//   return updatedBooking;
// };

// ===================== Cancel Booking =====================
const cancelBooking = async (id: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, 'Invalid booking ID');
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'user is not found');

  const booking = await Booking.findById(id).populate({
    path: 'serviceId',
    select: 'userId',
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  // Authorization check
  if (user.role !== 'admin') {
    const isBookingOwner = booking.userId.toString() === userId;
    if (!isBookingOwner) {
      throw new AppError(403, 'You can only cancel your own bookings');
    }
  }

  // Check if already cancelled or completed
  if (booking.status === 'cancelled') {
    throw new AppError(400, 'Booking is already cancelled');
  }
  if (booking.status === 'completed') {
    throw new AppError(400, 'Cannot cancel completed booking');
  }

  // Update booking status
  booking.status = 'cancelled';
  await booking.save();

  // Update user's cancelled booking array
  user.cencleBooking = user.cencleBooking || [];
  if (!user.cencleBooking.includes(booking._id)) {
    user.cencleBooking.push(booking._id);
    await user.save();
  }

  // TODO: Process refund if payment was made
  // Find payment and initiate refund through Stripe
  const payment = await Payment.findOne({ booking: booking._id });
  if (payment && payment.status === 'completed') {
    // Here you can implement Stripe refund logic
    console.log('Refund needed for payment:', payment._id);
  }

  return booking;
};

// ===================== Delete Booking (Admin Only) =====================
const deleteBooking = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, 'Invalid booking ID');
  }

  const booking = await Booking.findByIdAndDelete(id);
  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  return booking;
};

// ===================== Get Booking Statistics =====================
const getBookingStats = async (userId?: string) => {
  let matchCondition: any = {};
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.role !== 'admin' && userId) {
    matchCondition = { userId };
  }

  const stats = await Booking.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const formattedStats = {
    total: 0,
    pending: 0,
    accepted: 0,
    completed: 0,
    cancelled: 0,
  };

  stats.forEach((stat) => {
    formattedStats[stat._id as keyof typeof formattedStats] = stat.count;
    formattedStats.total += stat.count;
  });

  return formattedStats;
};

// ===================== Get User Booking Management =====================
const getUserBookingManagement = async (options: IOption) => {
  const { page, limit, skip } = pagination(options);

  const pipeline: mongoose.PipelineStage[] = [
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'userId',
        as: 'bookings',
      },
    },
    {
      $addFields: {
        totalBooking: { $size: '$bookings' },
        completedBooking: {
          $size: {
            $filter: {
              input: '$bookings',
              as: 'b',
              cond: { $eq: ['$$b.status', 'completed'] },
            },
          },
        },
        cancelledBooking: {
          $size: {
            $filter: {
              input: '$bookings',
              as: 'b',
              cond: { $eq: ['$$b.status', 'cancelled'] },
            },
          },
        },
      },
    },
    {
      $project: {
        firstName: 1,
        lastName: 1,
        email: 1,
        profileImage: 1,
        totalBooking: 1,
        completedBooking: 1,
        cancelledBooking: 1,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ];

  const data = await User.aggregate(pipeline);

  const total = await User.countDocuments();

  return {
    data,
    meta: { total, page, limit },
  };
};

export const bookingService = {
  createBooking,
  getAllBooking,
  getSingleBooking,
  updateBooking,
  deleteBooking,
  getAllMyBooking,
  getMyServiceBookings,
  cancelBooking,
  getBookingStats,
  getUserBookingManagement,
};
