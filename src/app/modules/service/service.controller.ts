import { Request, Response } from 'express';
import { serviceService } from './service.service';

const registerServiceController = async (req: Request, res: Response) => {
  const result = await serviceService.registerServiceAndSubscription(req.body);

  res.status(200).json({
    success: true,
    message: 'Service registered successfully',
    data: result,
  });
};

export const serviceController = {
  registerServiceController,
};
