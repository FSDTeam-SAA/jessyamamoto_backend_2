import AppError from "../../error/appError";
import pagination, { IOption } from "../../helper/pagenation";
import { ICountry } from "./countery.interface";
import Country from "./countery.model";


const createCountry = async (payload: ICountry) => {
  const isExist = await Country.findOne({
    countryName: payload.countryName,
    cityName: payload.cityName,
  });

  if (isExist) {
    throw new AppError(400, "Country already exists");
  }

  return await Country.create(payload);
};

const getAllCountries = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];

  const searchableFields = ["countryName", "cityName"];

  if (searchTerm) {
    andCondition.push({
      $or: searchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: "i" },
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

  const whereCondition =
    andCondition.length > 0 ? { $and: andCondition } : {};

  const result = await Country.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Country.countDocuments(whereCondition);

  return {
    data: result,
    meta: { total, page, limit },
  };
};

const getCountry = async (id: string) => {
  const data = await Country.findById(id);
  if (!data) throw new AppError(404, "Country not found");
  return data;
};

const updateCountry = async (id: string, payload: Partial<ICountry>) => {
  const updated = await Country.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updated) throw new AppError(404, "Country not found");
  return updated;
};

const deleteCountry = async (id: string) => {
  const deleted = await Country.findByIdAndDelete(id);

  if (!deleted) throw new AppError(404, "Country not found");
  return deleted;
};

export const countryService = {
  createCountry,
  getAllCountries,
  getCountry,
  updateCountry,
  deleteCountry,
};