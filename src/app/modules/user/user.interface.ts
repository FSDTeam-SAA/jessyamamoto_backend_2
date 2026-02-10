import mongoose, { Types } from 'mongoose';

export interface IUser {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  role: 'find job' | 'find care' | 'admin';
  profileImage?: string;
  bio?: string;
  phone?: string;
  location?: string;
  otp?: string;
  otpExpiry?: Date;
  verified?: boolean;
  isSubscription?: boolean;
  subscription?: Types.ObjectId;
  subscriptionExpiry?: Date;
  zip: number;
  hourRate?: number;
  days?: string[];
  needCare?: string;
  kindOfCare?: string;
  typeOfCare?: string[];
  needToHelpWith?: string[];
  caregiverQualities?: string[];
  // job
  status?: 'active' | 'inactive';
  gender?: 'male' | 'female' | 'other';
  languages?: string[];
  experienceLevel?: 'beginner' | 'intermediate' | 'expert';
  category?: Types.ObjectId[];
  service?: Types.ObjectId[];
  totalBooking?: Types.ObjectId[];
  completeBooking?: Types.ObjectId[];
  cencleBooking?: Types.ObjectId[];
}
