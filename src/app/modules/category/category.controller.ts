import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { CategoryService } from './category.service';

const createCategory = catchAsync(async (req, res) => {
  const file = req.file;
  const fromData = req.body.data ? JSON.parse(req.body.data) : req.body;
  const result = await CategoryService.createCategory(fromData, file);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const getAllCategory = catchAsync(async (req, res) => {
  const filters = pick(req.query, ['searchTerm', 'name']);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await CategoryService.getAllCategory(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Category retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryService.getSingleCategory(id!);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Category retrieved successfully',
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const file = req.file;
  const fromData = req.body.data ? JSON.parse(req.body.data) : req.body;
  const result = await CategoryService.updateCategory(id!, fromData, file);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});
const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryService.deleteCategory(id!);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Category deleted successfully',
    data: result,
  });
});
export const CategoryController = {
  createCategory,
  getAllCategory,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};
