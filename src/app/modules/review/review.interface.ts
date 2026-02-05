import { Types } from 'mongoose';

export interface IReview {
  userId: Types.ObjectId;
  jobUserId?: Types.ObjectId;
  ratting: number;
  safetyConcern?: boolean;
  reviewText?: string;
  hiredThroughPlatform?: boolean;
}
