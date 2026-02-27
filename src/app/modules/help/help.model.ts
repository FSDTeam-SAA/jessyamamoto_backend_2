import mongoose from 'mongoose';
import { IHlep } from './help.interface';

const helpSchema = new mongoose.Schema<IHlep>(
  {
    contactUs: { type: String },
    message: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const Help = mongoose.model<IHlep>('Help', helpSchema);

export default Help;
