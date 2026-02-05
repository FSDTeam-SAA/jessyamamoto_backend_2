import express from 'express';

import { conversationController } from './conversation.controller';
import { userRole } from '../user/user.constant';
import { auth } from '../../middlewares/auth';

const router = express.Router();

// All routes require authentication
router.use(auth(userRole['find job'], userRole['find care']));

// CREATE Routes
router.post('/:userId', conversationController.startConversation);
// READ Routes
router.get('/', conversationController.getUserConversations);
router.delete(
  '/:conversationId/for-me',
  conversationController.deleteConversationForMe,
);
router.delete(
  '/:conversationId/clear',
  conversationController.clearConversation,
);

export const conversationRoutes = router;
