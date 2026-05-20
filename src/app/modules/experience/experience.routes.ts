import express from 'express';
import { experienceController } from './experience.controller';
import { auth } from '../../middlewares/auth';
import { userRole } from '../user/user.constant';

const router = express.Router();

router.post('/', auth(userRole.admin), experienceController.createExperience);
router.get('/', experienceController.getAllExperience);
router.get('/:id', experienceController.getSingleExperience);
router.put('/:id', auth(userRole.admin), experienceController.updateExperience);
router.delete(
  '/:id',
  auth(userRole.admin),
  experienceController.deleteExperience,
);

export const experienceRoutes = router;
