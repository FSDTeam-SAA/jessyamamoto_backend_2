import Conversation from './conversation.model';
import Message from '../message/message.model';
import { Types } from 'mongoose';

const createConversation = async (user1Id: string, user2Id: string) => {
  const existingConversation = await Conversation.findOne({
    participants: { $all: [user1Id, user2Id] },
  });

  if (existingConversation) {
    // If conversation was deleted by someone, remove from deletedBy array
    if (existingConversation.deletedBy.length > 0) {
      existingConversation.deletedBy = existingConversation.deletedBy.filter(
        (id) =>
          !id.equals(new Types.ObjectId(user1Id)) &&
          !id.equals(new Types.ObjectId(user2Id)),
      );
      await existingConversation.save();
    }
    return existingConversation;
  }

  const conversation = await Conversation.create({
    participants: [user1Id, user2Id],
  });

  return conversation;
};

// READ - Get conversations for a user
const getConversations = async (userId: string) => {
  const conversations = await Conversation.find({
    participants: userId,
    deletedBy: { $ne: new Types.ObjectId(userId) },
  })
    .populate('participants', 'firstName lastName profileImage role')
    .populate('lastMessageReceiverId', '_id')
    .sort({ lastMessageAt: -1 })
    .lean();

  // Only show unreadCount for current user when they are the receiver of last message
  const userObjId = userId.toString();
  return conversations.map((c: any) => {
    const receiverId = c.lastMessageReceiverId?._id?.toString();
    const effectiveUnread = receiverId === userObjId ? (c.unreadCount || 0) : 0;
    const { lastMessageReceiverId, ...rest } = c;
    return { ...rest, unreadCount: effectiveUnread };
  });
};

// DELETE - Delete conversation for a user
const deleteConversationForUser = async (
  conversationId: string,
  userId: string,
) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const userObjectId = new Types.ObjectId(userId);

  // Add user to deletedBy array
  if (!conversation.deletedBy.some((id) => id.equals(userObjectId))) {
    conversation.deletedBy.push(userObjectId);
    await conversation.save();
  }

  return conversation;
};

// DELETE - Clear all messages in conversation for a user
const clearConversation = async (conversationId: string, userId: string) => {
  const userObjectId = new Types.ObjectId(userId);

  // Add user to deletedBy array for all messages in this conversation
  await Message.updateMany(
    {
      conversationId,
      deletedBy: { $ne: userObjectId },
    },
    {
      $addToSet: { deletedBy: userObjectId },
    },
  );

  // Mark all messages as read
  await Message.updateMany(
    {
      conversationId,
      receiverId: userId,
      read: false,
    },
    { read: true },
  );

  // Reset unread count
  await Conversation.findByIdAndUpdate(conversationId, {
    unreadCount: 0,
  });

  const conversation = await Conversation.findById(conversationId);
  return conversation;
};

export const conversationService = {
  createConversation,
  getConversations,
  deleteConversationForUser,
  clearConversation,
};
