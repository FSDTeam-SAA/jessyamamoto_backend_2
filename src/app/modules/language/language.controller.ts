import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { languageService } from './language.service';

const createLanguage = catchAsync(async (req, res) => {
  const result = await languageService.createLanguage(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Language created successfully',
    data: result,
  });
});

const getAllLanguage = catchAsync(async (req, res) => {
  const params = pick(req.query, ['searchTerm', 'languageName']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await languageService.getAllLanguages(params, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Languages fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleLanguage = catchAsync(async (req, res) => {
  const result = await languageService.getLanguage(req.params.id!);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Language fetched successfully',
    data: result,
  });
});

const updateLanguage = catchAsync(async (req, res) => {
  const result = await languageService.updateLanguage(req.params.id!, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Language updated successfully',
    data: result,
  });
});

const deleteLanguage = catchAsync(async (req, res) => {
  const result = await languageService.deleteLanguage(req.params.id!);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Language deleted successfully',
    data: result,
  });
});

export const languageController = {
  createLanguage,
  getAllLanguage,
  getSingleLanguage,
  updateLanguage,
  deleteLanguage,
};
