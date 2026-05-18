import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import { IEducation } from './education.interface';
import Education from './education.model';

const createEducation = async (payload: IEducation) => {
  const isExist = await Education.findOne({
    institutionName: payload.institutionName,
  });

  if (isExist) {
    throw new AppError(400, 'Education already exists');
  }

  return await Education.create(payload);
};

const getAllEducations = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];

  const searchableFields = ['institutionName'];

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

  const result = await Education.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Education.countDocuments(whereCondition);

  return {
    data: result,
    meta: { total, page, limit },
  };
};

const getEducation = async (id: string) => {
  const data = await Education.findById(id);
  if (!data) throw new AppError(404, 'Education not found');
  return data;
};

const updateEducation = async (id: string, payload: Partial<IEducation>) => {
  const isExist = await Education.findById(id);
  if (!isExist) throw new AppError(404, 'Education not found');

  if (payload.institutionName) {
    const duplicate = await Education.findOne({
      institutionName: payload.institutionName,
      _id: { $ne: id },
    });
    if (duplicate) throw new AppError(400, 'Institution name already exists');
  }

  const updated = await Education.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updated;
};

const deleteEducation = async (id: string) => {
  const deleted = await Education.findByIdAndDelete(id);
  if (!deleted) throw new AppError(404, 'Education not found');
  return deleted;
};

export const educationService = {
  createEducation,
  getAllEducations,
  getEducation,
  updateEducation,
  deleteEducation,
};
