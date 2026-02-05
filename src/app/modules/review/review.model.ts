import mongoose from 'mongoose';
import { IReview } from './review.interface';

const reviewSchema = new mongoose.Schema<IReview>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratting: {
      type: Number,
      required: true,
    },
    safetyConcern: {
      type: Boolean,
    },
    reviewText: {
      type: String,
    },
    hiredThroughPlatform: {
      type: Boolean,
    },
  },
  { timestamps: true },
);


const Review = mongoose.model<IReview>('Review', reviewSchema);
export default Review;