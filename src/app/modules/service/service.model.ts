import mongoose, { Schema } from 'mongoose';
import { IService } from './service.interface';

const ServiceSchema = new Schema<IService>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    hourRate: {
      type: Number,
    },
    typeOfInterest: {
      type: String,
    },
    helpOfInterest: {
      type: String,
    },
    days: {
      day: {
        type: [String],
        required: true,
      },
      time: {
        type: [Date],
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

const Service = mongoose.model<IService>('Service', ServiceSchema);
export default Service;
