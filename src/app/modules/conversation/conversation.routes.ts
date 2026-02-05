import express from 'express';
import auth from '../../middlewares/auth';
import { conversationController } from './conversation.controller';
import { userRole } from '../user/user.constant';

const router = express.Router();

// All routes require authentication
router.use(auth(userRole.user, userRole.job));

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
