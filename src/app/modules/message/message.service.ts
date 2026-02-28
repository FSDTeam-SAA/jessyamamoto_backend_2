// CREATE - Send message
import Message from './message.model';
import Conversation from '../conversation/conversation.model';
import { Types } from 'mongoose';

const sendMessage = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  message: string,
  messageType: string = 'text',
  attachments?: string[],
) => {
  // Create message
  const newMessage = await Message.create({
    conversationId,
    senderId,
    receiverId,
    message,
    messageType,
    attachments: attachments || [],
  });

  // Update conversation last message - unreadCount is for the receiver only
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message,
    lastMessageAt: new Date(),
    lastMessageReceiverId: receiverId,
    $inc: { unreadCount: 1 },
  });

  // Populate sender and receiver details
  const populatedMessage = await Message.findById(newMessage._id)
    .populate('senderId', 'firstName lastName profileImage role')
    .populate('receiverId', 'firstName lastName profileImage role');

  return populatedMessage;
};

// READ - Get messages from a conversation
const getMessages = async (conversationId: string, userId: string) => {
  // Get messages that are not deleted by this user
  const messages = await Message.find({
    conversationId,
    deletedBy: { $ne: new Types.ObjectId(userId) },
  })
    .populate('senderId', 'firstName lastName profileImage role')
    .populate('receiverId', 'firstName lastName profileImage role')
    .sort({ createdAt: 1 })
    .lean();

  // Mark unread messages as read
  const unreadMessageIds = messages
    .filter((msg) => !msg.read && 
      msg.receiverId && 
      typeof msg.receiverId === 'object' && 
      '_id' in msg.receiverId && 
      msg.receiverId._id.toString() === userId)
    .map((msg) => msg._id);

  if (unreadMessageIds.length > 0) {
    await Message.updateMany(
      { _id: { $in: unreadMessageIds } },
      { $set: { read: true } },
    );

    // Reset unread count for this conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      unreadCount: 0,
    });
  }

  return messages;
};

// READ - Get conversation IDs for given message IDs
const getConversationIdsForMessages = async (messageIds: string[]) => {
  const messages = await Message.find({ _id: { $in: messageIds } })
    .select('conversationId')
    .lean();
  return [...new Set(messages.map((m) => m.conversationId?.toString()).filter(Boolean))];
};

// READ - Get single message by ID
const getMessageById = async (messageId: string, userId: string) => {
  const message = await Message.findOne({
    _id: messageId,
    deletedBy: { $ne: userId },
  })
    .populate('senderId', 'firstName lastName profileImage role')
    .populate('receiverId', 'firstName lastName profileImage role');

  return message;
};

// UPDATE - Edit message
const editMessage = async (
  messageId: string,
  userId: string,
  newMessage: string,
) => {
  // Check if message exists and user is the sender
  const message = await Message.findOne({
    _id: messageId,
    senderId: userId,
    deletedBy: { $ne: userId },
  });

  if (!message) {
    throw new Error('Message not found or you are not authorized to edit');
  }

  // Update message
  message.message = newMessage;
  message.edited = true;
  await message.save();

  // Update conversation last message if this is the last message
  const lastMessageInConversation = await Message.findOne({
    conversationId: message.conversationId,
  })
    .sort({ createdAt: -1 })
    .limit(1);

  if (lastMessageInConversation?._id.equals(messageId)) {
    await Conversation.findByIdAndUpdate(message.conversationId, {
      lastMessage: newMessage,
    });
  }

  const populatedMessage = await Message.findById(message._id)
    .populate('senderId', 'firstName lastName profileImage role')
    .populate('receiverId', 'firstName lastName profileImage role');

  return populatedMessage;
};

// UPDATE - Mark message as read
const markAsRead = async (messageId: string, userId: string) => {
  const message = await Message.findOneAndUpdate(
    {
      _id: messageId,
      receiverId: userId,
      read: false,
      deletedBy: { $ne: userId },
    },
    { read: true },
    { new: true },
  );

  if (message) {
    // Decrement conversation unread count (don't go below 0)
    await Conversation.findOneAndUpdate(
      { _id: message.conversationId, lastMessageReceiverId: userId },
      { $inc: { unreadCount: -1 } },
    );
    // Ensure unreadCount never goes negative
    await Conversation.updateOne(
      { _id: message.conversationId, unreadCount: { $lt: 0 } },
      { $set: { unreadCount: 0 } },
    );
  }

  return message;
};

// UPDATE - Mark multiple messages as read
const markMultipleAsRead = async (messageIds: string[], userId: string) => {
  // First get messages that will be updated (before update)
  const toUpdate = await Message.find({
    _id: { $in: messageIds },
    receiverId: userId,
    read: false,
    deletedBy: { $ne: new Types.ObjectId(userId) },
  })
    .select('conversationId')
    .lean();

  const result = await Message.updateMany(
    {
      _id: { $in: messageIds },
      receiverId: userId,
      read: false,
      deletedBy: { $ne: userId },
    },
    { read: true },
  );

  if (result.modifiedCount > 0 && toUpdate.length > 0) {
    const convCounts = new Map<string, number>();
    for (const m of toUpdate) {
      const id = m.conversationId.toString();
      convCounts.set(id, (convCounts.get(id) ?? 0) + 1);
    }
    for (const [convId, count] of convCounts) {
      await Conversation.findOneAndUpdate(
        { _id: convId, lastMessageReceiverId: userId },
        { $inc: { unreadCount: -count } },
      );
      await Conversation.updateOne(
        { _id: convId, unreadCount: { $lt: 0 } },
        { $set: { unreadCount: 0 } },
      );
    }
  }

  return result;
};

// DELETE - Soft delete message for a user
const deleteMessageForUser = async (messageId: string, userId: string) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new Error('Message not found');
  }

  // Add user to deletedBy array
  const userObjectId = new Types.ObjectId(userId);
  if (!message.deletedBy.some((id) => id.equals(userObjectId))) {
    message.deletedBy.push(userObjectId);
    await message.save();
  }

  return message;
};

// DELETE - Delete message for everyone
const deleteMessageForEveryone = async (messageId: string, userId: string) => {
  const message = await Message.findOne({
    _id: messageId,
    senderId: userId, // Only sender can delete for everyone
  });

  if (!message) {
    throw new Error('Message not found or you are not authorized');
  }

  // Delete the message completely
  await Message.findByIdAndDelete(messageId);

  // Update conversation last message
  const lastMessage = await Message.findOne({
    conversationId: message.conversationId,
  })
    .sort({ createdAt: -1 })
    .limit(1);

  if (lastMessage) {
    await Conversation.findByIdAndUpdate(message.conversationId, {
      lastMessage: lastMessage.message,
      lastMessageAt: lastMessage.createdAt,
    });
  } else {
    // If no messages left, update with empty message
    await Conversation.findByIdAndUpdate(message.conversationId, {
      lastMessage: '',
    });
  }

  return message;
};

export const messageService = {
  sendMessage,
  getMessages,
  getConversationIdsForMessages,
  getMessageById,
  editMessage,
  markAsRead,
  markMultipleAsRead,
  deleteMessageForUser,
  deleteMessageForEveryone,
};
