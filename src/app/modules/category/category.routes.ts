import express from 'express';
import { CategoryController } from './category.controller';
const router = express.Router();


router.post('/', CategoryController.createCategory);
router.get('/', CategoryController.getAllCategory);
router.get('/:id', CategoryController.getSingleCategory);
router.put('/:id', CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);

export const categoryRouter = router;
