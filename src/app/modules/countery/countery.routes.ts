import express from 'express';
import { countryController } from './countery.controller';
import { auth } from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { fileUploader } from '../../helper/fileUploder';
const router = express.Router();

router.post(
  '/',
  auth(userRole.admin),
  fileUploader.upload.single('image'),
  countryController.createCountry,
);
router.get('/', countryController.getAllCountry);
router.patch('/:id/city/add', auth(userRole.admin), countryController.addCity);
router.patch(
  '/:id/city/remove',
  auth(userRole.admin),
  countryController.removeCity,
);
router.patch(
  '/:id/neighborhood/add',
  auth(userRole.admin),
  countryController.addNeighborhood,
);
router.patch(
  '/:id/city/:cityName/neighborhood/add',
  auth(userRole.admin),
  countryController.addNeighborhood,
);
router.patch(
  '/:id/neighborhood/remove',
  auth(userRole.admin),
  countryController.removeNeighborhood,
);
router.patch(
  '/:id/city/:cityName/neighborhood/remove',
  auth(userRole.admin),
  countryController.removeNeighborhood,
);
router.get('/:id', countryController.getCountryById);
router.put(
  '/:id',
  auth(userRole.admin),
  fileUploader.upload.single('image'),
  countryController.updateCountry,
);
router.delete('/:id', auth(userRole.admin), countryController.deleteCountry);

export const countryRoutes = router;
