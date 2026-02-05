import express from 'express';
import { serviceController } from './service.controller';

const router = express.Router();

router.post('/register-service', serviceController.registerServiceController);

export const serviceRouter = router;
