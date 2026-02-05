import { Types } from 'mongoose';

export interface IMessage {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  message: string;
  messageType: 'text' | 'image' | 'file' | 'audio';
  read: boolean;
  deletedBy: Types.ObjectId[]; // Array of user IDs who deleted the message
  edited: boolean;
  attachments?: string[]; // Array of file URLs
  createdAt: Date;
  updatedAt: Date;
}
