import { Types } from 'mongoose';

export interface IPendingServiceRegistration {
  categoryId: string;
  zip?: string;
  gender: string;
  days?: string[];
  hourRate?: number;
}

export interface IPayment {
  user?: Types.ObjectId;
  subscription?: Types.ObjectId;
  category?: Types.ObjectId;
  service?: Types.ObjectId;
  stripeSessionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentType: 'subscription' | 'booking';
  userType: 'findJob' | 'findCare';
  createdAt?: Date;
  updatedAt?: Date;
  stripePaymentIntentId?: string;
  booking?: Types.ObjectId;
  adminFree?: number;
  serviceProviderFree?: number;
  pendingServiceRegistration?: IPendingServiceRegistration;
}
