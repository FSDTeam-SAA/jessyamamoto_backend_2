import { Types } from 'mongoose';

export interface IBooking {
  userId?: Types.ObjectId;
  serviceId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  day?: string;
  date?: string;
  time?: string;
  status?: 'pending' | 'accepted' | 'completed' | 'cancelled';
  location?: string;
}
