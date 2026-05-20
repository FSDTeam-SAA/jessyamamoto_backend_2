import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import { IExperience } from './experience.interface';
import Experience from './experience.model';

const createExperience = async (payload: IExperience) => {
  const isExist = await Experience.findOne({
    experienceName: payload.experienceName,
  });

  if (isExist) {
    throw new AppError(400, 'Experience already exists');
  }

  return await Experience.create(payload);
};

const getAllExperiences = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];

  const searchableFields = ['experienceName'];

  if (searchTerm) {
    andCondition.push({
      $or: searchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    });
  }

  if (Object.keys(filterData).length) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const result = await Experience.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Experience.countDocuments(whereCondition);

  return {
    data: result,
    meta: { total, page, limit },
  };
};

const getExperience = async (id: string) => {
  const data = await Experience.findById(id);
  if (!data) throw new AppError(404, 'Experience not found');
  return data;
};

const updateExperience = async (id: string, payload: Partial<IExperience>) => {
  const isExist = await Experience.findById(id);
  if (!isExist) throw new AppError(404, 'Experience not found');

  if (payload.experienceName) {
    const duplicate = await Experience.findOne({
      experienceName: payload.experienceName,
      _id: { $ne: id },
    });
    if (duplicate) throw new AppError(400, 'Experience name already exists');
  }

  const updated = await Experience.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updated;
};

const deleteExperience = async (id: string) => {
  const deleted = await Experience.findByIdAndDelete(id);
  if (!deleted) throw new AppError(404, 'Experience not found');
  return deleted;
};

export const experienceService = {
  createExperience,
  getAllExperiences,
  getExperience,
  updateExperience,
  deleteExperience,
};
