import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { bookmarkService } from './bookmark.service';

const addBookmark = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const result = await bookmarkService.addBookmark(
    userId,
    req.params.providerId!,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Bookmark added successfully',
    data: result,
  });
});

const getAllMyBookmark = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const filters = pick(req.query, [
    'searchTerm',
    'firstName',
    'lastName',
    'bio',
    'phone',
    'status',
    'gender',
    'email',
    'role',
    'location',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await bookmarkService.getAllMyBookmark(
    userId,
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bookmark retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const removeBookmark = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const result = await bookmarkService.removeBookmark(
    userId,
    req.params.providerId!,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bookmark removed successfully',
    data: result,
  });
});

const getSingleBookmarkuser = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const result = await bookmarkService.getSingleBookmarkuser(
    userId,
    req.params.providerId!,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bookmark retrieved successfully',
    data: result,
  });
});

export const bookmarkController = {
  addBookmark,
  getAllMyBookmark,
  removeBookmark,
  getSingleBookmarkuser
};
