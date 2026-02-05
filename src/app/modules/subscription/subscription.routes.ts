import express from 'express';
import { subscriptionController } from './subscription.controller';
const router = express.Router();

router.post('/', subscriptionController.createSubscription);
router.get('/', subscriptionController.getAllSubscriptions);
router.get('/:id', subscriptionController.singleSubscription);
router.put('/:id', subscriptionController.updateSubscription);
router.delete('/:id', subscriptionController.deleteSubscription);

export const subscriptionRouter = router;
