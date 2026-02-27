import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import User from '../user/user.model';
import { IHlep } from './help.interface';
import Help from './help.model';

const createHelp = async (
  userId: string,
  payload: IHlep,
  file?: Express.Multer.File,
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User is not found');
  if (file) {
    const helpImage = await fileUploader.uploadToCloudinary(file);
    payload.contactUs = helpImage.url;
  }

  const result = await Help.create({ ...payload, user: user._id });
  return result;
};

export const helpService = {
  createHelp,
};
