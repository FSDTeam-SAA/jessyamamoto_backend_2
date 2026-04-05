import AppError from '../../error/appError';
import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { CategoryService } from './category.service';

const createCategory = catchAsync(async (req, res) => {
  const files = req.files as {
    image?: Express.Multer.File[];
    banner?: Express.Multer.File[];
  };

  const formData = req.body.data ? JSON.parse(req.body.data) : req.body;

  const result = await CategoryService.createCategory(formData, files);

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
    meta: {
      ...result.meta,
      /** Each new service category needs its own Stripe checkout (POST /service/register-service). */
      serviceActivationRequiresPaidMembership: true,
      perCategoryPaymentRequired: true,
    },
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

  // support multiple files: image + banner
  const files = req.files as {
    image?: Express.Multer.File[];
    banner?: Express.Multer.File[];
  };

  // parse JSON safely
  let formData;
  try {
    formData = req.body.data ? JSON.parse(req.body.data) : req.body;
  } catch (error) {
    console.log(error)
    throw new AppError(400, 'Invalid JSON format in data field');
  }

  const result = await CategoryService.updateCategory(id!, formData, files);

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
