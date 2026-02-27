import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { helpService } from './help.service';

const createHelp = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const file = req.file as Express.Multer.File;
  const fromData = req.body.data ? JSON.parse(req.body.data) : req.body;
  const result = await helpService.createHelp(userId, fromData, file);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Help create successfully',
    data: result,
  });
});

export const helpController = {
  createHelp,
};
