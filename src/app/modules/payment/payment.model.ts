import mongoose from 'mongoose';
import { IPayment } from './payment.interface';

const paymentSchema = new mongoose.Schema<IPayment>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    stripeSessionId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'refunded'],
    },
    paymentType: {
      type: String,
      required: true,
      enum: ['subscription', 'booking'],
    },
    userType: {
      type: String,
      enum: ['findJob', 'findCare'],
      required: true,
    },
    stripePaymentIntentId: { type: String },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    adminFree: {
      type: Number,
    },
    serviceProviderFree:{
      type:Number
    }
  },
  { timestamps: true },
);

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;
