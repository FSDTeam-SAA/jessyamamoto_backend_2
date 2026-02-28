import { Types } from 'mongoose';

export interface ICategory {
  image?: string;
  name: string;
  description?: string;
  banner?: string[];
  findCareUser?: Types.ObjectId[];
  findJobUser?: Types.ObjectId[];
}
