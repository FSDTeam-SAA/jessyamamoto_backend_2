import express from 'express';
import { languageController } from './language.controller';
import { auth } from '../../middlewares/auth';
import { userRole } from '../user/user.constant';

const router = express.Router();

router.post('/', auth(userRole.admin), languageController.createLanguage);
router.get('/', languageController.getAllLanguage);
router.get('/:id', languageController.getSingleLanguage);
router.put('/:id', auth(userRole.admin), languageController.updateLanguage);
router.delete('/:id', auth(userRole.admin), languageController.deleteLanguage);

export const languageRoutes = router;
