import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import pagination, { IOption } from '../../helper/pagenation';
import { ICity, ICountry } from './countery.interface';
import Country from './countery.model';

const createCountry = async (payload: ICountry, file?: Express.Multer.File) => {
  const isExist = await Country.findOne({
    countryName: payload.countryName,
  });

  if (isExist) {
    throw new AppError(400, 'Country already exists');
  }

  if (file) {
    const { url } = await fileUploader.uploadToCloudinary(file);
    payload.image = url;
  }
  return await Country.create(payload);
};

const getAllCountries = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];

  const searchableFields = [
    'countryName',
    'cities.cityName',
    'cities.neighborhoods',
  ];

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
        [field === 'cityName'
          ? 'cities.cityName'
          : field === 'neighborhoods'
            ? 'cities.neighborhoods'
            : field]: value,
      })),
    });
  }
  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

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
  if (!data) throw new AppError(404, 'Country not found');
  return data;
};

const updateCountry = async (
  id: string,
  payload: Partial<ICountry>,
  file?: Express.Multer.File,
) => {
  if (file) {
    const { url } = await fileUploader.uploadToCloudinary(file);
    payload.image = url;
  }

  const updated = await Country.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updated) throw new AppError(404, 'Country not found');
  return updated;
};

const deleteCountry = async (id: string) => {
  const deleted = await Country.findByIdAndDelete(id);

  if (!deleted) throw new AppError(404, 'Country not found');
  return deleted;
};

const addCityToCountry = async (id: string, city: ICity) => {
  const country = await Country.findById(id);
  if (!country) throw new AppError(404, 'Country not found');

  if (country.cities.some((item) => item.cityName === city.cityName)) {
    throw new AppError(400, 'City already exists in this country');
  }

  const updated = await Country.findByIdAndUpdate(
    id,
    { $push: { cities: city } },
    { new: true, runValidators: true },
  );

  return updated;
};

const removeCityFromCountry = async (id: string, cityName: string) => {
  const country = await Country.findById(id);
  if (!country) throw new AppError(404, 'Country not found');

  if (!country.cities.some((city) => city.cityName === cityName)) {
    throw new AppError(404, 'City not found in this country');
  }

  const updated = await Country.findByIdAndUpdate(
    id,
    { $pull: { cities: { cityName } } },
    { new: true },
  );

  return updated;
};

const addNeighborhoodToCountry = async (
  id: string,
  cityName: string,
  neighborhood: string,
) => {
  const country = await Country.findById(id);
  if (!country) throw new AppError(404, 'Country not found');

  const city = country.cities.find((item) => item.cityName === cityName);
  if (!city) {
    throw new AppError(404, 'City not found in this country');
  }

  if (city.neighborhoods.includes(neighborhood)) {
    throw new AppError(400, 'Neighborhood already exists in this city');
  }

  city.neighborhoods.push(neighborhood);
  return await country.save();
};

const removeNeighborhoodFromCountry = async (
  id: string,
  cityName: string,
  neighborhood: string,
) => {
  const country = await Country.findById(id);
  if (!country) throw new AppError(404, 'Country not found');

  const city = country.cities.find((item) => item.cityName === cityName);
  if (!city) {
    throw new AppError(404, 'City not found in this country');
  }

  if (!city.neighborhoods.includes(neighborhood)) {
    throw new AppError(404, 'Neighborhood not found in this city');
  }

  city.neighborhoods = city.neighborhoods.filter(
    (item) => item !== neighborhood,
  );

  return await country.save();
};

export const countryService = {
  createCountry,
  getAllCountries,
  getCountry,
  updateCountry,
  deleteCountry,
  addCityToCountry,
  removeCityFromCountry,
  addNeighborhoodToCountry,
  removeNeighborhoodFromCountry,
};
