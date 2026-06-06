import AppError from '../../error/appError';
import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { countryService } from './countery.service';


const createCountry = catchAsync(async (req, res) => {
  const file = req.file; // Get the uploaded file
  const data = req.body.data ? JSON.parse(req.body.data) : req.body; // Parse data if it's sent as a string
  const result = await countryService.createCountry(data, file);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Country created successfully',
    data: result,
  });
});

const getAllCountry = catchAsync(async (req, res) => {
  const params = pick(req.query, [
    'searchTerm',
    'countryName',
    'cityName',
    'neighborhoods',
  ]);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await countryService.getAllCountries(params, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Countries fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getCountryById = catchAsync(async (req, res) => {
  const result = await countryService.getCountry(req.params.id!);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Country fetched successfully',
    data: result,
  });
});

const updateCountry = catchAsync(async (req, res) => {
  const file = req.file; // Get the uploaded file
  const data = req.body.data ? JSON.parse(req.body.data) : req.body; // Parse data if it's sent as a string
  const result = await countryService.updateCountry(req.params.id!, data, file);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Country updated successfully',
    data: result,
  });
});

const deleteCountry = catchAsync(async (req, res) => {
  const result = await countryService.deleteCountry(req.params.id!);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Country deleted successfully',
    data: result,
  });
});


const addCity = catchAsync(async (req, res) => {
  const { cityName, neighborhoods = [] } = req.body;
  if (!cityName) {
    throw new AppError(400, 'cityName is required');
  }

  const result = await countryService.addCityToCountry(req.params.id!, {
    cityName,
    neighborhoods,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'City added successfully',
    data: result,
  });
});

const removeCity = catchAsync(async (req, res) => {
  const { cityName } = req.body;
  if (!cityName) {
    throw new AppError(400, 'cityName is required');
  }

  const result = await countryService.removeCityFromCountry(
    req.params.id!,
    cityName,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'City removed successfully',
    data: result,
  });
});

const addNeighborhood = catchAsync(async (req, res) => {
  const cityName = req.params.cityName || req.body.cityName;
  const { neighborhood } = req.body;
  if (!cityName) {
    throw new AppError(400, 'cityName is required');
  }
  if (!neighborhood) {
    throw new AppError(400, 'neighborhood is required');
  }

  const result = await countryService.addNeighborhoodToCountry(
    req.params.id!,
    cityName,
    neighborhood,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Neighborhood added successfully',
    data: result,
  });
});

const removeNeighborhood = catchAsync(async (req, res) => {
  const cityName = req.params.cityName || req.body.cityName;
  const { neighborhood } = req.body;
  if (!cityName) {
    throw new AppError(400, 'cityName is required');
  }
  if (!neighborhood) {
    throw new AppError(400, 'neighborhood is required');
  }

  const result = await countryService.removeNeighborhoodFromCountry(
    req.params.id!,
    cityName,
    neighborhood,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Neighborhood removed successfully',
    data: result,
  });
});


export const countryController = {
  createCountry,
  getAllCountry,
  getCountryById,
  updateCountry,
  deleteCountry,
  addCity,
  removeCity,
  addNeighborhood,
  removeNeighborhood,
};
