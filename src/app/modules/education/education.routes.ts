import express from 'express';
import { educationController } from './education.controller';
import { auth } from '../../middlewares/auth';
import { userRole } from '../user/user.constant';

const router = express.Router();

router.post('/', auth(userRole.admin), educationController.createEducation);
router.get('/', educationController.getAllEducation);
router.get('/:id', educationController.getSingleEducation);
router.put('/:id', auth(userRole.admin), educationController.updateEducation);
router.delete(
  '/:id',
  auth(userRole.admin),
  educationController.deleteEducation,
);

export const educationRoutes = router;
