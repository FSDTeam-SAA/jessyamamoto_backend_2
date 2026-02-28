import { Types } from 'mongoose';

export interface IConversation {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  lastMessage: string;
  lastMessageAt: Date;
  lastMessageReceiverId?: Types.ObjectId; // Receiver of last message - unreadCount applies to this user only
  unreadCount: number;
  deletedBy: Types.ObjectId[]; // Array of user IDs who deleted the conversation
}
