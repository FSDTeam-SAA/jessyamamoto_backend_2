import { Types } from 'mongoose';

export interface IHlep {
  contactUs?: string;
  message?: string;
  user?: Types.ObjectId;
}
