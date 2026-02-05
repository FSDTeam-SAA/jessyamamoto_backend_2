import express from 'express';
import auth from '../../middlewares/auth';
import { messageController } from './message.controller';
import { userRole } from '../user/user.constant';

const router = express.Router();

// All routes require authentication
router.use(auth(userRole.user, userRole.job));

// CREATE Routes
router.post('/send', messageController.sendMessage);

// READ Routes
router.get(
  '/conversation/:conversationId/messages',
  messageController.getConversationMessages,
);
router.get('/:messageId', messageController.getMessage);

// UPDATE Routes
router.put('/:messageId/edit', messageController.editMessage);
router.patch('/:messageId/read', messageController.markMessageAsRead);
router.patch('/read', messageController.markMessagesAsRead);

// DELETE Routes
router.delete('/:messageId/for-me', messageController.deleteMessageForMe);
router.delete(
  '/:messageId/for-everyone',
  messageController.deleteMessageForEveryone,
);

export const messageRoutes = router;
