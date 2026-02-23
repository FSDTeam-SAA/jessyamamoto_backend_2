// import Booking from './booking.model';
// import AppError from '../../error/appError';
// import Service from '../service/service.model';
// import User from '../user/user.model';
// import Payment from '../payment/payment.model';
// import pagination, { IOption } from '../../helper/pagenation';
// import mongoose from 'mongoose';
// import Stripe from 'stripe';
// import config from '../../config';

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

// // ===================== Create Booking with Payment =====================
// const createBooking = async (payload: {
//   serviceId: string;
//   day: string;
//   date: string;
//   time: string;
//   userId: string;
// }) => {
//   // Validate date format
//   if (!isValidDate(payload.date)) {
//     throw new AppError(400, 'Invalid date format. Use YYYY-MM-DD');
//   }

//   // Validate booking date
//   validateBookingDate(payload.date);

//   // Validate ObjectId
//   if (!mongoose.Types.ObjectId.isValid(payload.serviceId)) {
//     throw new AppError(400, 'Invalid service ID');
//   }

//   const userId = await User.findById(payload.userId);

//   if (!userId) {
//     throw new AppError(400, 'Invalid user ID');
//   }

//   if (userId.isSubscription === false) {
//     throw new AppError(403, 'You need to subscribe to find care');
//   }

//   // Get service details
//   const service = await Service.findById(payload.serviceId)
//     .populate('userId')
//     .populate('categoryId');

//   if (!service) {
//     throw new AppError(404, 'Service not found');
//   }

//   // Check if service is active
//   if (service.status !== 'pending') {
//     throw new AppError(400, 'This service is not available for booking');
//   }

//   // Validate user exists
//   const user = await User.findById(payload.userId);
//   if (!user) {
//     throw new AppError(404, 'User not found');
//   }

//   // Check user role (only 'find care' can book)
//   if (user.role !== 'find care') {
//     throw new AppError(403, 'Only users looking for care can create bookings');
//   }

//   // Prevent self-booking
//   if (service.userId._id.toString() === payload.userId) {
//     throw new AppError(400, 'You cannot book your own service');
//   }

//   // Day validation
//   if (!service.days?.day || !service.days.day.includes(payload.day)) {
//     throw new AppError(
//       400,
//       `Service is not available on ${payload.day}. Available days: ${service.days?.day?.join(', ') || 'None'}`,
//     );
//   }

//   // Time validation
//   if (!service.days?.time || !service.days.time.includes(payload.time)) {
//     throw new AppError(
//       400,
//       `Service is not available at ${payload.time}. Available times: ${service.days?.time?.join(', ') || 'None'}`,
//     );
//   }

//   // Date + day match validation
//   validateDayAndDate(payload.day, payload.date);

//   // Slot conflict check
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

//   // Calculate amount (assuming hourly rate for 1 hour)
//   const amount = service.hourRate || 0;

//   // Start transaction
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Create Stripe Checkout Session
//     const checkoutSession = await stripe.checkout.sessions.create({
//       mode: 'payment',
//       payment_method_types: ['card'],
//       customer_email: user.email,
//       line_items: [
//         {
//           price_data: {
//             currency: 'usd',
//             unit_amount: amount * 100, // Convert to cents
//             product_data: {
//               name: `Booking: ${service.firstName} ${service.lastName}`,
//               description: `${payload.day}, ${payload.date} at ${payload.time}`,
//             },
//           },
//           quantity: 1,
//         },
//       ],
//       success_url: `${config.frontendUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${config.frontendUrl}/booking-cancel`,
//       metadata: {
//         userId: payload.userId,
//         serviceId: payload.serviceId,
//         day: payload.day,
//         date: payload.date,
//         time: payload.time,
//         paymentType: 'booking',
//       },
//     });

//     // Create booking
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
//           status: 'pending', // Will be updated to 'accepted' after payment
//         },
//       ],
//       { session },
//     );

//     // Create payment record
//     if (!createdBooking) {
//       throw new AppError(500, 'Failed to create booking');
//     }

//     user.totalBooking?.push(createdBooking._id);
//     await user.save();

//     // await Payment.create(
//     //   [
//     //     {
//     //       user: payload.userId,
//     //       service: service._id,
//     //       booking: createdBooking._id,
//     //       category: service.categoryId,
//     //       stripeSessionId: checkoutSession.id,
//     //       amount,
//     //       currency: 'usd',
//     //       status: 'pending',
//     //       paymentType: 'shop',
//     //       userType: 'findCare',
//     //     },
//     //   ],
//     //   { session },
//     // );

//     await session.commitTransaction();
//     session.endSession();

//     if (!createdBooking) {
//       throw new AppError(500, 'Failed to create booking');
//     }

//     return {
//       booking: createdBooking,
//       // checkoutUrl: checkoutSession.url,
//       // sessionId: checkoutSession.id,
//     };
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
// };

// // ===================== Get All Bookings (Admin) =====================
// const getAllBooking = async (params: any, options: IOption) => {
//   const { page, limit, skip, sortBy, sortOrder } = pagination(options);
//   const { searchTerm, status, date, day, userId, serviceId, ...filterData } =
//     params;

//   const andCondition: any[] = [];

//   // Search functionality
//   if (searchTerm) {
//     andCondition.push({
//       $or: [
//         { day: { $regex: searchTerm, $options: 'i' } },
//         { date: { $regex: searchTerm, $options: 'i' } },
//         { time: { $regex: searchTerm, $options: 'i' } },
//         { location: { $regex: searchTerm, $options: 'i' } },
//       ],
//     });
//   }

//   // Filter by status
//   if (status) {
//     andCondition.push({ status });
//   }

//   // Filter by date
//   if (date) {
//     andCondition.push({ date });
//   }

//   // Filter by day
//   if (day) {
//     andCondition.push({ day });
//   }

//   // Filter by userId
//   if (userId && mongoose.Types.ObjectId.isValid(userId)) {
//     andCondition.push({ userId: new mongoose.Types.ObjectId(userId) });
//   }

//   // Filter by serviceId
//   if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
//     andCondition.push({ serviceId: new mongoose.Types.ObjectId(serviceId) });
//   }

//   // Other filters
//   if (Object.keys(filterData).length) {
//     andCondition.push({
//       $and: Object.entries(filterData).map(([field, value]) => ({
//         [field]: value,
//       })),
//     });
//   }

//   const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

//   const result = await Booking.find(whereCondition)
//     .populate({
//       path: 'userId',
//       select: 'firstName lastName email phone profileImage role',
//     })
//     .populate({
//       path: 'serviceId',
//       select: 'firstName lastName email location hourRate gender days',
//     })
//     .populate({
//       path: 'categoryId',
//       select: 'name',
//     })
//     .skip(skip)
//     .limit(limit)
//     .sort({ [sortBy]: sortOrder } as any);

//   const total = await Booking.countDocuments(whereCondition);

//   return {
//     data: result,
//     meta: {
//       total,
//       page,
//       limit,
//     },
//   };
// };

// // ===================== Get My Bookings (User) =====================
// const getAllMyBooking = async (
//   userId: string,
//   params: any,
//   options: IOption,
// ) => {
//   const { page, limit, skip, sortBy, sortOrder } = pagination(options);
//   const { searchTerm, status, date, upcoming, ...filterData } = params;

//   const andCondition: any[] = [{ userId }];

//   // Search functionality
//   if (searchTerm) {
//     andCondition.push({
//       $or: [
//         { day: { $regex: searchTerm, $options: 'i' } },
//         { time: { $regex: searchTerm, $options: 'i' } },
//         { location: { $regex: searchTerm, $options: 'i' } },
//       ],
//     });
//   }

//   // Filter by status
//   if (status) {
//     andCondition.push({ status });
//   }

//   // Filter by date
//   if (date) {
//     andCondition.push({ date });
//   }

//   // Filter upcoming bookings
//   if (upcoming === 'true') {
//     const today = new Date().toISOString().split('T')[0];
//     andCondition.push({ date: { $gte: today } });
//   }

//   // Other filters
//   if (Object.keys(filterData).length) {
//     andCondition.push({
//       $and: Object.entries(filterData).map(([field, value]) => ({
//         [field]: value,
//       })),
//     });
//   }

//   const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

//   const result = await Booking.find(whereCondition)
//     .populate({
//       path: 'serviceId',
//       select: 'firstName lastName email location hourRate gender days',
//       populate: {
//         path: 'userId',
//         select: 'firstName lastName email phone profileImage',
//       },
//     })
//     .populate({
//       path: 'categoryId',
//       select: 'name',
//     })
//     .skip(skip)
//     .limit(limit)
//     .sort({ [sortBy]: sortOrder } as any);

//   const total = await Booking.countDocuments(whereCondition);

//   return {
//     data: result,
//     meta: {
//       total,
//       page,
//       limit,
//     },
//   };
// };

// // ===================== Get Bookings for Service Provider =====================
// const getMyServiceBookings = async (
//   userId: string,
//   params: any,
//   options: IOption,
// ) => {
//   const { page, limit, skip, sortBy, sortOrder } = pagination(options);
//   const { searchTerm, status, date, upcoming, ...filterData } = params;

//   // Find all services of this user
//   const services = await Service.find({ userId });
//   const serviceIds = services.map((s) => s._id);

//   if (serviceIds.length === 0) {
//     return {
//       data: [],
//       meta: { total: 0, page, limit },
//     };
//   }

//   const andCondition: any[] = [{ serviceId: { $in: serviceIds } }];

//   // Search functionality
//   if (searchTerm) {
//     andCondition.push({
//       $or: [
//         { day: { $regex: searchTerm, $options: 'i' } },
//         { time: { $regex: searchTerm, $options: 'i' } },
//         { location: { $regex: searchTerm, $options: 'i' } },
//       ],
//     });
//   }

//   // Filter by status
//   if (status) {
//     andCondition.push({ status });
//   }

//   // Filter by date
//   if (date) {
//     andCondition.push({ date });
//   }

//   // Filter upcoming bookings
//   if (upcoming === 'true') {
//     const today = new Date().toISOString().split('T')[0];
//     andCondition.push({ date: { $gte: today } });
//   }

//   // Other filters
//   if (Object.keys(filterData).length) {
//     andCondition.push({
//       $and: Object.entries(filterData).map(([field, value]) => ({
//         [field]: value,
//       })),
//     });
//   }

//   const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

//   const result = await Booking.find(whereCondition)
//     .populate({
//       path: 'userId',
//       select: 'firstName lastName email phone profileImage',
//     })
//     .populate({
//       path: 'serviceId',
//       select: 'firstName lastName location hourRate',
//     })
//     .populate({
//       path: 'categoryId',
//       select: 'name',
//     })
//     .skip(skip)
//     .limit(limit)
//     .sort({ [sortBy]: sortOrder } as any);

//   const total = await Booking.countDocuments(whereCondition);

//   return {
//     data: result,
//     meta: {
//       total,
//       page,
//       limit,
//     },
//   };
// };

// // ===================== Get Single Booking =====================
// const getSingleBooking = async (id: string, userId?: string, role?: string) => {
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     throw new AppError(400, 'Invalid booking ID');
//   }

//   const booking = await Booking.findById(id)
//     .populate({
//       path: 'userId',
//       select: 'firstName lastName email phone profileImage role',
//     })
//     .populate({
//       path: 'serviceId',
//       select: 'firstName lastName email location hourRate gender days userId',
//       populate: {
//         path: 'userId',
//         select: 'firstName lastName email phone profileImage',
//       },
//     })
//     .populate({
//       path: 'categoryId',
//       select: 'name',
//     });

//   if (!booking) {
//     throw new AppError(404, 'Booking not found');
//   }

//   // Authorization check
//   if (role !== 'admin' && userId) {
//     const isBookingOwner = booking.userId._id.toString() === userId;
//     const isServiceProvider =
//       (booking.serviceId as any).userId?._id.toString() === userId;

//     if (!isBookingOwner && !isServiceProvider) {
//       throw new AppError(
//         403,
//         'You do not have permission to view this booking',
//       );
//     }
//   }

//   return booking;
// };

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

//     // Service provider can only update status
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
//       pending: ['accepted', 'cancelled'],
//       accepted: ['completed', 'cancelled'],
//     };

//     const allowedStatuses = validTransitions[booking.status] || [];
//     if (!allowedStatuses.includes(payload.status)) {
//       throw new AppError(
//         400,
//         `Cannot change status from ${booking.status} to ${payload.status}`,
//       );
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

// // ===================== Cancel Booking =====================
// const cancelBooking = async (id: string, userId: string) => {
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     throw new AppError(400, 'Invalid booking ID');
//   }

//   const user = await User.findById(userId);
//   if (!user) throw new AppError(404, 'user is not found');

//   const booking = await Booking.findById(id).populate({
//     path: 'serviceId',
//     select: 'userId',
//   });

//   // console.log(booking);
//   if (!booking) {
//     throw new AppError(404, 'Booking not found');
//   }

//   // Authorization check
//   if (user.role !== 'admin') {
//     const isBookingOwner = booking.userId.toString() === userId;
//     if (!isBookingOwner) {
//       throw new AppError(403, 'You can only cancel your own bookings');
//     }
//   }

//   // Check if already cancelled or completed
//   if (booking.status === 'cancelled') {
//     throw new AppError(400, 'Booking is already cancelled');
//   }
//   if (booking.status === 'completed') {
//     throw new AppError(400, 'Cannot cancel completed booking');
//   }

//   // Update booking status
//   booking.status = 'cancelled';
//   await booking.save();

//   // user.cencleBooking?.push(booking._id);
//   // await user.save();

//   // TODO: Process refund if payment was made
//   // Find payment and initiate refund through Stripe

//   return booking;
// };

// // ===================== Delete Booking (Admin Only) =====================
// const deleteBooking = async (id: string) => {
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     throw new AppError(400, 'Invalid booking ID');
//   }

//   const booking = await Booking.findByIdAndDelete(id);
//   if (!booking) {
//     throw new AppError(404, 'Booking not found');
//   }

//   return booking;
// };

// // ===================== Get Booking Statistics =====================
// const getBookingStats = async (userId?: string) => {
//   let matchCondition: any = {};
//   const user = await User.findById(userId);
//   if (!user) {
//     throw new AppError(404, 'User not found');
//   }

//   if (user.role !== 'admin' && userId) {
//     matchCondition = { userId };
//   }

//   const stats = await Booking.aggregate([
//     { $match: matchCondition },
//     {
//       $group: {
//         _id: '$status',
//         count: { $sum: 1 },
//       },
//     },
//   ]);

//   const formattedStats = {
//     total: 0,
//     pending: 0,
//     accepted: 0,
//     completed: 0,
//     cancelled: 0,
//   };

//   stats.forEach((stat) => {
//     formattedStats[stat._id as keyof typeof formattedStats] = stat.count;
//     formattedStats.total += stat.count;
//   });

//   return formattedStats;
// };

// //========================================getUserBookingManagement=========================

// const getUserBookingManagement = async (options: IOption) => {
//   const { page, limit, skip } = pagination(options);

//   const pipeline: mongoose.PipelineStage[] = [
//     {
//       $lookup: {
//         from: 'bookings',
//         localField: '_id',
//         foreignField: 'userId',
//         as: 'bookings',
//       },
//     },
//     {
//       $addFields: {
//         totalBooking: { $size: '$bookings' },
//         completedBooking: {
//           $size: {
//             $filter: {
//               input: '$bookings',
//               as: 'b',
//               cond: { $eq: ['$$b.status', 'completed'] },
//             },
//           },
//         },
//         cancelledBooking: {
//           $size: {
//             $filter: {
//               input: '$bookings',
//               as: 'b',
//               cond: { $eq: ['$$b.status', 'cancelled'] },
//             },
//           },
//         },
//       },
//     },
//     {
//       $project: {
//         firstName: 1,
//         lastName: 1,
//         email: 1,
//         profileImage: 1,
//         totalBooking: 1,
//         completedBooking: 1,
//         cancelledBooking: 1,
//       },
//     },
//     { $skip: skip },
//     { $limit: limit },
//   ];

//   const data = await User.aggregate(pipeline);

//   const total = await User.countDocuments();

//   return {
//     data,
//     meta: { total, page, limit },
//   };
// };

// export const bookingService = {
//   createBooking,
//   getAllBooking,
//   getSingleBooking,
//   updateBooking,
//   deleteBooking,
//   getAllMyBooking,
//   getMyServiceBookings,
//   cancelBooking,
//   getBookingStats,
//   getUserBookingManagement,
// };

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

const stripe = new Stripe(config.stripe.secretKey!);

// ===================== Helper: Validate Date Format =====================
const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
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
    status: { $in: ['pending', 'accepted'] }, // Only active bookings block slots
  };

  // Exclude current booking when updating
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflict = await Booking.findOne(query);
  return !conflict;
};

// ===================== Helper: Validate Day and Date Match =====================
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
  const actualDay = weekDays[bookingDate.getDay()];

  if (actualDay !== day) {
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

// ===================== Create Booking with Payment =====================
// const createBooking = async (payload: {
//   serviceId: string;
//   day: string;
//   date: string;
//   time: string;
//   userId: string;
// }) => {
//   // Validate date format
//   if (!isValidDate(payload.date)) {
//     throw new AppError(400, 'Invalid date format. Use YYYY-MM-DD');
//   }

//   // Validate booking date
//   validateBookingDate(payload.date);

//   // Validate ObjectId
//   if (!mongoose.Types.ObjectId.isValid(payload.serviceId)) {
//     throw new AppError(400, 'Invalid service ID');
//   }

//   const user = await User.findById(payload.userId);

//   if (!user) {
//     throw new AppError(400, 'Invalid user ID');
//   }

//   if (user.isSubscription === false) {
//     throw new AppError(403, 'You need to subscribe to find care');
//   }

//   // Get service details
//   const service = await Service.findById(payload.serviceId)
//     .populate('userId')
//     .populate('categoryId');

//   if (!service) {
//     throw new AppError(404, 'Service not found');
//   }

//   // Check if service is active
//   if (service.status !== 'pending') {
//     throw new AppError(400, 'This service is not available for booking');
//   }

//   // Check user role (only 'find care' can book)
//   if (user.role !== 'find care') {
//     throw new AppError(403, 'Only users looking for care can create bookings');
//   }

//   // Prevent self-booking
//   if (service.userId._id.toString() === payload.userId) {
//     throw new AppError(400, 'You cannot book your own service');
//   }

//   // Day validation
//   if (!service.days?.day || !service.days.day.includes(payload.day)) {
//     throw new AppError(
//       400,
//       `Service is not available on ${payload.day}. Available days: ${service.days?.day?.join(', ') || 'None'}`,
//     );
//   }

//   // Time validation
//   if (!service.days?.time || !service.days.time.includes(payload.time)) {
//     throw new AppError(
//       400,
//       `Service is not available at ${payload.time}. Available times: ${service.days?.time?.join(', ') || 'None'}`,
//     );
//   }

//   // Date + day match validation
//   validateDayAndDate(payload.day, payload.date);

//   // Slot conflict check
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

//   // Get service provider (find job user)
//   const serviceProvider = service.userId as any;

//   // Check if service provider has stripe account
//   if (!serviceProvider.stripeAccountId) {
//     throw new AppError(
//       400,
//       'Service provider has not completed Stripe account setup',
//     );
//   }

//   // Calculate amount
//   const hourRate = service.hourRate || 0;
//   const totalAmount = hourRate * 100; // Convert to cents
//   const adminFee = Math.round(totalAmount * 0.1); // 10% admin commission
//   const providerAmount = totalAmount - adminFee; // 90% to service provider

//   // Start transaction
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Create Stripe Checkout Session with payment to connected account
//     const checkoutSession = await stripe.checkout.sessions.create({
//       mode: 'payment',
//       payment_method_types: ['card'],
//       customer_email: user.email,
//       line_items: [
//         {
//           price_data: {
//             currency: 'usd',
//             unit_amount: totalAmount,
//             product_data: {
//               name: `Booking: ${service.firstName} ${service.lastName}`,
//               description: `${payload.day}, ${payload.date} at ${payload.time}`,
//             },
//           },
//           quantity: 1,
//         },
//       ],
//       payment_intent_data: {
//         application_fee_amount: adminFee, // Admin gets 10%
//         transfer_data: {
//           destination: serviceProvider.stripeAccountId, // Service provider gets 90%
//         },
//       },
//       success_url: `${config.frontendUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${config.frontendUrl}/booking-cancel`,
//       metadata: {
//         userId: payload.userId,
//         serviceId: payload.serviceId,
//         serviceProviderId: serviceProvider._id.toString(),
//         day: payload.day,
//         date: payload.date,
//         time: payload.time,
//         paymentType: 'booking',
//         totalAmount: (totalAmount / 100).toString(),
//         adminFee: (adminFee / 100).toString(),
//         providerAmount: (providerAmount / 100).toString(),
//       },
//     });

//     // Create booking
//     const [createdBooking] = await Booking.create(
//       [
//         {
//           serviceId: service._id,
//           categoryId: service.categoryId._id,
//           userId: payload.userId,
//           day: payload.day,
//           date: payload.date,
//           time: payload.time,
//           location: service.location,
//           status: 'pending', // Will be updated after payment
//         },
//       ],
//       { session },
//     );

//     if (!createdBooking) {
//       throw new AppError(500, 'Failed to create booking');
//     }

//     // Create payment record
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
//           adminFree: adminFee / 100,
//           serviceProviderFree: providerAmount / 100,
//         },
//       ],
//       { session },
//     );

//     // Update user's booking array
//     user.totalBooking = user.totalBooking || [];
//     user.totalBooking.push(createdBooking._id);
//     await user.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     return {
//       booking: createdBooking,
//       checkoutUrl: checkoutSession.url,
//       sessionId: checkoutSession.id,
//       paymentDetails: {
//         totalAmount: hourRate,
//         adminCommission: adminFee / 100,
//         providerAmount: providerAmount / 100,
//       },
//     };
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
// };




//=====================================update code====================================
const createBooking = async (payload: {
  serviceId: string;
  day: string;
  date: string;
  time: string;
  userId: string;
}) => {
  // ================= DATE VALIDATION =================
  if (!isValidDate(payload.date)) {
    throw new AppError(400, 'Invalid date format. Use YYYY-MM-DD');
  }

  validateBookingDate(payload.date);
  validateDayAndDate(payload.day, payload.date);

  // ================= OBJECT ID VALIDATION =================
  if (!mongoose.Types.ObjectId.isValid(payload.serviceId)) {
    throw new AppError(400, 'Invalid service ID');
  }

  // ================= USER CHECK =================
  const user = await User.findById(payload.userId);
  if (!user) throw new AppError(404, 'User not found');

  if (!user.isSubscription) {
    throw new AppError(403, 'You need to subscribe to find care');
  }

  if (user.role !== 'find care') {
    throw new AppError(403, 'Only users looking for care can create bookings');
  }

  // ================= SERVICE CHECK =================
  const service = await Service.findById(payload.serviceId)
    .populate('userId')
    .lean(); // 👈 IMPORTANT

  if (!service) throw new AppError(404, 'Service not found');

  if (!service.categoryId) {
    throw new AppError(400, 'Service category not found');
  }

  if (service.status !== 'pending') {
    throw new AppError(400, 'This service is not available for booking');
  }

  // Prevent self booking
  if (service.userId._id.toString() === payload.userId) {
    throw new AppError(400, 'You cannot book your own service');
  }

  // ================= DAY VALIDATION =================
  if (!service.days?.day?.includes(payload.day)) {
    throw new AppError(
      400,
      `Service is not available on ${payload.day}`
    );
  }

  // ================= TIME VALIDATION =================
  if (!service.days?.time?.includes(payload.time)) {
    throw new AppError(
      400,
      `Service is not available at ${payload.time}`
    );
  }

  // ================= SLOT CHECK =================
  const available = await isSlotAvailable(
    payload.serviceId,
    payload.day,
    payload.date,
    payload.time,
  );

  if (!available) {
    throw new AppError(
      409,
      'This time slot is already booked for the selected date',
    );
  }

  // ================= PROVIDER CHECK =================
  const serviceProvider: any = service.userId;

  if (!serviceProvider.stripeAccountId) {
    throw new AppError(
      400,
      'Service provider has not completed Stripe setup',
    );
  }

  // ================= PAYMENT CALCULATION =================
  const hourRate = service.hourRate || 0;
  const totalAmount = hourRate * 100;
  const adminFee = Math.round(totalAmount * 0.1);
  const providerAmount = totalAmount - adminFee;

  // ================= TRANSACTION START =================
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ================= STRIPE SESSION =================
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: totalAmount,
            product_data: {
              name: `Booking: ${service.firstName} ${service.lastName}`,
              description: `${payload.day}, ${payload.date} at ${payload.time}`,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: adminFee,
        transfer_data: {
          destination: serviceProvider.stripeAccountId,
        },
      },
      success_url: `${config.frontendUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontendUrl}/booking-cancel`,
      metadata: {
        userId: payload.userId,
        serviceId: payload.serviceId,
        serviceProviderId: serviceProvider._id.toString(),
        day: payload.day,
        date: payload.date,
        time: payload.time,
        paymentType: 'booking',
      },
    });

    // ================= CREATE BOOKING =================
    const [createdBooking] = await Booking.create(
      [
        {
          serviceId: service._id,
          categoryId: service.categoryId, // ✅ FIXED (no ._id crash)
          userId: payload.userId,
          day: payload.day,
          date: payload.date,
          time: payload.time,
          location: service.location,
          status: 'pending',
        },
      ],
      { session },
    );

    // ================= CREATE PAYMENT =================
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
          adminFree: adminFee / 100,
          serviceProviderFree: providerAmount / 100,
        },
      ],
      { session },
    );

    // ================= UPDATE USER =================
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
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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
    const today = new Date().toISOString().split('T')[0];
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
    const today = new Date().toISOString().split('T')[0];
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

// ===================== Update Booking =====================
const updateBooking = async (id: string, payload: any, userId?: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, 'Invalid booking ID');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const booking = await Booking.findById(id).populate({
    path: 'serviceId',
    select: 'userId days',
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  // Authorization check
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

    // Service provider can only update status to accept or complete
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

  // Prevent updating completed or cancelled bookings
  if (['completed', 'cancelled'].includes(booking.status)) {
    throw new AppError(400, `Cannot update ${booking.status} booking`);
  }

  // If updating time slot, validate availability
  if (payload.day || payload.date || payload.time) {
    const day = payload.day || booking.day;
    const date = payload.date || booking.date;
    const time = payload.time || booking.time;

    // Validate date format
    if (payload.date && !isValidDate(payload.date)) {
      throw new AppError(400, 'Invalid date format. Use YYYY-MM-DD');
    }

    // Validate booking date
    if (payload.date) {
      validateBookingDate(payload.date);
    }

    // Validate day and date match
    validateDayAndDate(day, date);

    // Check service availability for new slot
    const service = booking.serviceId as any;
    if (payload.day && !service?.days?.day?.includes(payload.day)) {
      throw new AppError(400, 'Service is not available on this day');
    }
    if (payload.time && !service?.days?.time?.includes(payload.time)) {
      throw new AppError(400, 'Service is not available at this time');
    }

    // Check slot availability - use _id from populated service
    const serviceIdString = (booking.serviceId as any)._id.toString();
    const available = await isSlotAvailable(
      serviceIdString,
      day,
      date,
      time,
      id, // Exclude current booking
    );

    if (!available) {
      throw new AppError(409, 'This time slot is already booked');
    }
  }

  // Status transition validation
  if (payload.status) {
    const validTransitions: { [key: string]: string[] } = {
      pending: ['accepted', 'cancelled'], // After payment, service provider can accept
      accepted: ['completed', 'cancelled'], // Service provider or user can complete
    };

    const allowedStatuses = validTransitions[booking.status] || [];
    if (!allowedStatuses.includes(payload.status)) {
      throw new AppError(
        400,
        `Cannot change status from ${booking.status} to ${payload.status}`,
      );
    }

    // Update user's booking arrays based on status
    if (payload.status === 'completed') {
      const bookingUser = await User.findById(booking.userId);
      if (bookingUser) {
        bookingUser.completeBooking = bookingUser.completeBooking || [];
        if (!bookingUser.completeBooking.includes(booking._id)) {
          bookingUser.completeBooking.push(booking._id);
          await bookingUser.save();
        }
      }
    }

    if (payload.status === 'cancelled') {
      const bookingUser = await User.findById(booking.userId);
      if (bookingUser) {
        bookingUser.cencleBooking = bookingUser.cencleBooking || [];
        if (!bookingUser.cencleBooking.includes(booking._id)) {
          bookingUser.cencleBooking.push(booking._id);
          await bookingUser.save();
        }
      }
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
