import mongoose from 'mongoose';
import { IUser } from './user.interface';
import bcrypt from 'bcryptjs';
import config from '../../config';

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // important for security
    },
    role: {
      type: String,
      enum: ['find job', 'find care', 'admin'],
      required: true,
    },
    profileImage: String,
    bio: String,
    phone: String,
    otp: String,
    otpExpiry: Date,
    verified: {
      type: Boolean,
      default: false,
    },
    isSubscription: {
      type: Boolean,
      default: false,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    subscriptionExpiry: Date,
    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    service: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
    location: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
    },
    totalBooking: [{ type: mongoose.Schema.ObjectId, ref: 'Booking' }],
    completeBooking: [{ type: mongoose.Schema.ObjectId, ref: 'Booking' }],
    cencleBooking: [{ type: mongoose.Schema.ObjectId, ref: 'Booking' }],
    stripeAccountId: { type: String },
    reviewRatting: [{ type: mongoose.Schema.ObjectId, ref: 'Review' }],
  },
  {
    timestamps: true,
  },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const hash = await bcrypt.hash(
    this.password,
    Number(config.bcryptSaltRounds),
  );
  this.password = hash;
  next();
});

const User = mongoose.model<IUser>('User', userSchema);
export default User;
