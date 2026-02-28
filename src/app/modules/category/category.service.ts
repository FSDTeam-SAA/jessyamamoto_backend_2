import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import pagination, { IOption } from '../../helper/pagenation';
import Service from '../service/service.model';
import { ICategory } from './category.interface';
import Category from './category.model';

const createCategory = async (
  payload: ICategory,
  files?: {
    image?: Express.Multer.File[];
    banner?: Express.Multer.File[];
  },
) => {
  //upload single image
  if (files?.image?.length) {
    const uploadedImage = await fileUploader.uploadToCloudinary(
      files.image[0]!,
    );
    payload.image = uploadedImage.url;
  }

  // upload multiple banners
  if (files?.banner?.length) {
    const bannerUrls: string[] = [];

    for (const file of files.banner) {
      const uploadedBanner = await fileUploader.uploadToCloudinary(file);
      bannerUrls.push(uploadedBanner.url);
    }

    payload.banner = bannerUrls;
  }

  const result = await Category.create(payload);

  if (!result) {
    throw new AppError(400, 'Category creation failed');
  }

  return result;
};

const getAllCategory = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = ['name'];

  if (searchTerm) {
    andCondition.push({
      $or: userSearchableFields.map((field) => ({
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

  const result = await Category.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  if (!result) {
    throw new AppError(404, 'Users not found');
  }

  const total = await Category.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const getSingleCategory = async (id: string) => {
  // Find the category
  const result = await Category.findById(id);
  if (!result) {
    throw new AppError(404, 'Category not found');
  }

  // Find services that include this category
  // const service = await Service.find({
  //   categoryIds: { $in: [result._id] },
  // }).populate('categoryIds');
  // if (!service.length) {
  //   throw new AppError(404, 'No services found for this category');
  // }

  // return { result, service };
  return result;
};

const updateCategory = async (
  id: string,
  payload: Partial<ICategory>,
  files?: {
    image?: Express.Multer.File[];
    banner?: Express.Multer.File[];
  },
) => {
  // upload new main image if provided
  const imageFile = files?.image?.[0];
  if (imageFile) {
    const uploadedImage = await fileUploader.uploadToCloudinary(imageFile);
    payload.image = uploadedImage.url;
  }

  // upload new banners if provided
  if (files?.banner && files.banner.length > 0) {
    const bannerUrls: string[] = [];

    for (const file of files.banner) {
      const uploadedBanner = await fileUploader.uploadToCloudinary(file);
      bannerUrls.push(uploadedBanner.url);
    }

    // replace the existing banner array
    payload.banner = bannerUrls;
  }

  // update the category
  const result = await Category.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(404, 'Category not found');
  }

  return result;
};

const deleteCategory = async (id: string) => {
  const result = await Category.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(404, 'Category not found');
  }

  await Service.updateMany({ categoryIds: id }, { $pull: { categoryIds: id } });

  return result;
};

export const CategoryService = {
  createCategory,
  getAllCategory,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};
