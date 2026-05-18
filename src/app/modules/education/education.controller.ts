import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { educationService } from './education.service';

const createEducation = catchAsync(async (req, res) => {
  const result = await educationService.createEducation(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Education created successfully',
    data: result,
  });
});

const getAllEducation = catchAsync(async (req, res) => {
  const params = pick(req.query, ['searchTerm', 'institutionName']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await educationService.getAllEducations(params, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Educations fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleEducation = catchAsync(async (req, res) => {
  const result = await educationService.getEducation(req.params.id!);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Education fetched successfully',
    data: result,
  });
});

const updateEducation = catchAsync(async (req, res) => {
  const result = await educationService.updateEducation(
    req.params.id!,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Education updated successfully',
    data: result,
  });
});

const deleteEducation = catchAsync(async (req, res) => {
  const result = await educationService.deleteEducation(req.params.id!);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Education deleted successfully',
    data: result,
  });
});

export const educationController = {
  createEducation,
  getAllEducation,
  getSingleEducation,
  updateEducation,
  deleteEducation,
};
