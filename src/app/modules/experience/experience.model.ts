import mongoose from 'mongoose';
import { IExperience } from './experience.interface';

const experienceSchema = new mongoose.Schema<IExperience>(
  {
    experienceName: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const Experience = mongoose.model<IExperience>('Experience', experienceSchema);
export default Experience;
