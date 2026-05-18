import mongoose from 'mongoose';
import { IEducation } from './education.interface';

const educationSchema = new mongoose.Schema<IEducation>(
  {
    institutionName: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const Education = mongoose.model<IEducation>('Education', educationSchema);
export default Education;
