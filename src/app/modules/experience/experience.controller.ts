import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { experienceService } from './experience.service';

const createExperience = catchAsync(async (req, res) => {
  const result = await experienceService.createExperience(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Experience created successfully',
    data: result,
  });
});

const getAllExperience = catchAsync(async (req, res) => {
  const params = pick(req.query, ['searchTerm', 'experienceName']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await experienceService.getAllExperiences(params, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Experiences fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleExperience = catchAsync(async (req, res) => {
  const result = await experienceService.getExperience(req.params.id!);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Experience fetched successfully',
    data: result,
  });
});

const updateExperience = catchAsync(async (req, res) => {
  const result = await experienceService.updateExperience(
    req.params.id!,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Experience updated successfully',
    data: result,
  });
});

const deleteExperience = catchAsync(async (req, res) => {
  const result = await experienceService.deleteExperience(req.params.id!);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Experience deleted successfully',
    data: result,
  });
});

export const experienceController = {
  createExperience,
  getAllExperience,
  getSingleExperience,
  updateExperience,
  deleteExperience,
};
