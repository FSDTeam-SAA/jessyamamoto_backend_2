import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsycn';
import AppError from '../error/appError';
import User from '../modules/user/user.model';

/** Use after `auth(...)`. Requires active membership (paid, not expired). */
export const requirePaidSubscription = () =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.user?.id;
    if (!id) throw new AppError(401, 'You are not authorized');

    const user = await User.findById(id).select(
      'isSubscription subscriptionExpiry',
    );
    if (!user) throw new AppError(404, 'User not found');

    if (!user.isSubscription) {
      throw new AppError(
        403,
        'Membership required. Complete Stripe payment to use Find Care / Find Job services.',
      );
    }

    const now = new Date();
    if (user.subscriptionExpiry) {
      const exp = new Date(user.subscriptionExpiry);
      if (!Number.isNaN(exp.getTime()) && exp <= now) {
        throw new AppError(
          403,
          'Membership required. Complete Stripe payment to use Find Care / Find Job services.',
        );
      }
    }
    next();
  });
