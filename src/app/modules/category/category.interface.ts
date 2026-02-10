import { Types } from 'mongoose';

export interface ICategory {
  image?: string;
  name: string;
  findCareUser?: Types.ObjectId[];
  findJobUser?: Types.ObjectId[];
}
