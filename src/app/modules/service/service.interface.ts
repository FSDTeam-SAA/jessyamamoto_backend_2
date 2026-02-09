import { Types } from 'mongoose';

export interface IService {
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  location: string;
  typeOfInterest?: string;
  helpOfInterest?: string;
  hourRate?: number;
  days?: {
    day: string[];
    time: string[];
  };
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
}
