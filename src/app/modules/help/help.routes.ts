import express from 'express';
import { auth } from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { fileUploader } from '../../helper/fileUploder';
import { helpController } from './help.controller';
const router = express.Router();

router.post(
  '/',
  auth(userRole['find care'], userRole['find job']),
  fileUploader.upload.single('contactUs'),
  helpController.createHelp,
);

export const helpRoutes = router;
