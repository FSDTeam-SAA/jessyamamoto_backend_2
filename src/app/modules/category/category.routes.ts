import express from 'express';
import { CategoryController } from './category.controller';
import { auth } from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { fileUploader } from '../../helper/fileUploder';
const router = express.Router();

router.post(
  '/',
  auth(userRole.admin),
  fileUploader.upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 10 },
  ]),
  CategoryController.createCategory,
);
router.get('/', CategoryController.getAllCategory);
router.get('/:id', CategoryController.getSingleCategory);
router.put(
  '/:id',
  auth(userRole.admin),
  fileUploader.upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 10 },
  ]),
  CategoryController.updateCategory,
);
router.delete('/:id', auth(userRole.admin), CategoryController.deleteCategory);

export const categoryRouter = router;
