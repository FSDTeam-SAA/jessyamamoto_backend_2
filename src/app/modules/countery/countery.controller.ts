import pick from "../../helper/pick";
import catchAsync from "../../utils/catchAsycn";
import sendResponse from "../../utils/sendResponse";
import { countryService } from "./countery.service";


const createCountry = catchAsync(async (req, res) => {
  const result = await countryService.createCountry(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Country created successfully",
    data: result,
  });
});

const getAllCountry = catchAsync(async (req, res) => {
  const params = pick(req.query, ["searchTerm", "countryName", "cityName"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await countryService.getAllCountries(params, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Countries fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getCountryById = catchAsync(async (req, res) => {
  const result = await countryService.getCountry(req.params.id!);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Country fetched successfully",
    data: result,
  });
});

const updateCountry = catchAsync(async (req, res) => {
  const result = await countryService.updateCountry(req.params.id!, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Country updated successfully",
    data: result,
  });
});

const deleteCountry = catchAsync(async (req, res) => {
  const result = await countryService.deleteCountry(req.params.id!);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Country deleted successfully",
    data: result,
  });
});

export const countryController = {
  createCountry,
  getAllCountry,
  getCountryById,
  updateCountry,
  deleteCountry,
};