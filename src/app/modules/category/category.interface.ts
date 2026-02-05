import { Types } from 'mongoose';

export interface ICategory {
  name: string;
  findCareUser?: Types.ObjectId[];
  findJobUser?: Types.ObjectId[];
}
