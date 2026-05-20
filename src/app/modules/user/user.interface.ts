import { Types } from 'mongoose';

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
  lng?: number;
  lat?: number;
  otp?: string;
  otpExpiry?: Date;
  verified?: boolean;
  isSubscription?: boolean;
  subscription?: Types.ObjectId;
  subscriptionExpiry?: Date;
  zip: string;
  hourRate?: number;
  days?: string[];
  needCare?: string;
  kindOfCare?: string;
  typeOfCare?: string[];
  needToHelpWith?: string[];
  caregiverQualities?: string[];
  NIDNumber: string;
  countery: string;
  city: string;
  // job
  status?: 'active' | 'inactive';
  gender?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'expert';
  userStatus?: 'approved' | 'reject' | 'panding';
  category?: Types.ObjectId[];
  service?: Types.ObjectId[];
  totalBooking?: Types.ObjectId[];
  completeBooking?: Types.ObjectId[];
  cencleBooking?: Types.ObjectId[];
  stripeAccountId?: string;
  reviewRatting?: Types.ObjectId[];
  givenReviewRatting?: Types.ObjectId[];
  exprience?: number;
  /** Find care: selected experience entries (titles from /experience API). */
  experiences?: string[];
  language?: string[];
  agegroup?: string[];
  education?: string[];
  canHelpWith?: string[];
  professionalSkill?: string[];
  perferences?: string[];
  /** Find care: uploaded certification document image URLs. */
  galary?: string[];
  certifications?: string[];
}
