// CREATE - Send message
import { getIO } from '../../../server';
import catchAsync from '../../utils/catchAsycn';
import { messageService } from './message.service';

// message.controller.ts - FIXED VERSION
const sendMessage = catchAsync(async (req, res) => {
  const {
    conversationId,
    receiverId,
    message,
    messageType = 'text',
    attachments,
  } = req.body;
  const senderId = req.user?.id;

  if (!senderId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  // Validate required fields
  if (!conversationId || !receiverId || !message) {
    return res.status(400).json({
      success: false,
      message: 'conversationId, receiverId and message are required',
    });
  }

  const newMessage = await messageService.sendMessage(
    conversationId,
    senderId,
    receiverId,
    message,
    messageType,
    attachments,
  );

  // After successfully saving to database, emit via socket
  const io = getIO();

  // Emit to conversation room
  io.to(conversationId).emit('newMessage', {
    ...newMessage?.toObject(),
    timestamp: new Date(),
  });

  // Emit to receiver's personal room
  io.to(receiverId).emit('messageReceived', {
    _id: newMessage?._id,
    conversationId,
    senderId,
    message,
    messageType,
    read: false,
    createdAt: newMessage?.createdAt,
    timestamp: new Date(),
  });

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: newMessage,
  });
});

const getConversationMessages = catchAsync(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  if (!conversationId) {
    return res.status(400).json({
      success: false,
      message: 'conversationId is required',
    });
  }

  const messages = await messageService.getMessages(conversationId, userId);

  // Emit to conversation room so inbox can refresh unread count
  const io = getIO();
  io.to(conversationId).emit('conversationRead', {
    conversationId,
    readBy: userId,
    unreadCount: 0,
  });

  res.status(200).json({
    success: true,
    message: 'Messages fetched successfully',
    data: messages,
  });
});

// READ - Get single message
const getMessage = catchAsync(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const message = await messageService.getMessageById(messageId!, userId);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Message fetched successfully',
    data: message,
  });
});

// UPDATE - Edit message
const editMessage = catchAsync(async (req, res) => {
  const { messageId } = req.params;
  const { message: newMessage } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const updatedMessage = await messageService.editMessage(
    messageId!,
    userId,
    newMessage,
  );

  res.status(200).json({
    success: true,
    message: 'Message updated successfully',
    data: updatedMessage,
  });
});

// UPDATE - Mark message as read
const markMessageAsRead = catchAsync(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const message = await messageService.markAsRead(messageId!, userId);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found or already read',
    });
  }

  const io = getIO();
  const senderId = typeof message.senderId === 'object' && message.senderId?._id
    ? message.senderId._id.toString()
    : message.senderId?.toString();
  if (senderId) {
    io.to(senderId).emit('messageRead', {
      messageId: message._id,
      conversationId: message.conversationId,
      readAt: new Date(),
    });
  }
  io.to(message.conversationId.toString()).emit('conversationRead', {
    conversationId: message.conversationId,
    readBy: userId,
  });

  res.status(200).json({
    success: true,
    message: 'Message marked as read',
    data: message,
  });
});

// UPDATE - Mark multiple messages as read
const markMessagesAsRead = catchAsync(async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  if (!Array.isArray(messageIds)) {
    return res.status(400).json({
      success: false,
      message: 'messageIds must be an array',
    });
  }

  const objectIds = messageIds.map((id) => id);
  const result = await messageService.markMultipleAsRead(objectIds, userId);

  if (result.modifiedCount > 0) {
    const io = getIO();
    const convIds = await messageService.getConversationIdsForMessages(objectIds);
    for (const convId of convIds) {
      if (convId) io.to(convId).emit('conversationRead', { conversationId: convId, readBy: userId });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Messages marked as read',
    data: { modifiedCount: result.modifiedCount },
  });
});

// DELETE - Delete message for me only
const deleteMessageForMe = catchAsync(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const message = await messageService.deleteMessageForUser(messageId!, userId);

  res.status(200).json({
    success: true,
    message: 'Message deleted for you',
    data: message,
  });
});

// DELETE - Delete message for everyone
const deleteMessageForEveryone = catchAsync(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const message = await messageService.deleteMessageForEveryone(
    messageId!,
    userId,
  );

  res.status(200).json({
    success: true,
    message: 'Message deleted for everyone',
    data: message,
  });
});

export const messageController = {
  sendMessage,
  getConversationMessages,
  getMessage,
  editMessage,
  markMessageAsRead,
  markMessagesAsRead,
  deleteMessageForMe,
  deleteMessageForEveryone,
};
