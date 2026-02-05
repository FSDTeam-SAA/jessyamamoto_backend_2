import catchAsync from '../../utils/catchAsycn';
import { conversationService } from './conversation.service';

const startConversation = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user?.id;

  if (!currentUserId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const conversation = await conversationService.createConversation(
    currentUserId,
    userId!,
  );

  res.status(200).json({
    success: true,
    message: 'Conversation started successfully',
    data: conversation,
  });
});

// READ - Get user conversations
const getUserConversations = catchAsync(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const conversations = await conversationService.getConversations(userId);

  res.status(200).json({
    success: true,
    message: 'Conversations fetched successfully',
    data: conversations,
  });
});

// DELETE - Delete conversation for me
const deleteConversationForMe = catchAsync(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const conversation = await conversationService.deleteConversationForUser(
    conversationId!,
    userId,
  );

  res.status(200).json({
    success: true,
    message: 'Conversation deleted for you',
    data: conversation,
  });
});

// DELETE - Clear all messages in conversation
const clearConversation = catchAsync(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const conversation = await conversationService.clearConversation(
    conversationId!,
    userId,
  );

  res.status(200).json({
    success: true,
    message: 'Conversation cleared successfully',
    data: conversation,
  });
});

export const conversationController = {
  clearConversation,
  deleteConversationForMe,
  getUserConversations,
  startConversation,
};
