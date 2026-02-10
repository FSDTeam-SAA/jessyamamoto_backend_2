import { Types } from 'mongoose';

export interface IPayment {
  user?: Types.ObjectId;
  subscription?: Types.ObjectId;
  category?: Types.ObjectId;
  service?: Types.ObjectId;
  stripeSessionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentType: 'subscription' | 'shop';
  userType: 'findJob' | 'findCare';
  createdAt?: Date;
  updatedAt?: Date;
  stripePaymentIntentId?: string;
  booking?: Types.ObjectId;
  adminFree?: number;
  serviceProviderFree?: number;
}
