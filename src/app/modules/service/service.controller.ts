import { Request, Response } from 'express';
import { serviceService } from './service.service';
import pick from '../../helper/pick';

const registerServiceController = async (req: Request, res: Response) => {
  const userId = req.user?.id || null;
  console.log(userId);
  const result = await serviceService.registerServiceAndSubscription(
    req.body,
    userId,
  );

  res.status(200).json({
    success: true,
    message: 'Service registered successfully',
    data: result,
  });
};

const serviceBaseUserController = async (req: Request, res: Response) => {
  const { categoryId } = req.params;
  const filters = pick(req.query, [
    'searchTerm',
    'firstName',
    'lastName',
    'email',
    'role',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await serviceService.serviceBaseUser(
    categoryId!,
    filters,
    options,
  );

  res.status(200).json({
    success: true,
    message: 'Service base user fetched successfully',
    data: result,
  });
};

export const serviceController = {
  registerServiceController,
  serviceBaseUserController,
};
