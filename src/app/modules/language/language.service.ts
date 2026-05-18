import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import { ILanguage } from './language.interface';
import Language from './language.model';

const createLanguage = async (payload: ILanguage) => {
  const isExist = await Language.findOne({
    languageName: payload.languageName,
  });

  if (isExist) {
    throw new AppError(400, 'Language already exists');
  }

  return await Language.create(payload);
};

const getAllLanguages = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];

  const searchableFields = ['languageName'];

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

  const result = await Language.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Language.countDocuments(whereCondition);

  return {
    data: result,
    meta: { total, page, limit },
  };
};

const getLanguage = async (id: string) => {
  const data = await Language.findById(id);
  if (!data) throw new AppError(404, 'Language not found');
  return data;
};

const updateLanguage = async (id: string, payload: Partial<ILanguage>) => {
  const isExist = await Language.findById(id);
  if (!isExist) throw new AppError(404, 'Language not found');

  if (payload.languageName) {
    const duplicate = await Language.findOne({
      languageName: payload.languageName,
      _id: { $ne: id },
    });
    if (duplicate) throw new AppError(400, 'Language name already exists');
  }

  const updated = await Language.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updated;
};

const deleteLanguage = async (id: string) => {
  const deleted = await Language.findByIdAndDelete(id);
  if (!deleted) throw new AppError(404, 'Language not found');
  return deleted;
};

export const languageService = {
  createLanguage,
  getAllLanguages,
  getLanguage,
  updateLanguage,
  deleteLanguage,
};
