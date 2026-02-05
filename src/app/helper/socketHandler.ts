// app/helper/socketHandler.ts - UPDATED VERSION
import { Server, Socket } from 'socket.io';
import { messageService } from '../modules/message/message.service';

interface MessageData {
  conversationId: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageType: 'text' | 'image' | 'file' | 'audio';
  attachments?: string[];
}

interface TypingData {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

const socketHandler = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('User is connected', socket.id);

    // Join user to their personal room
    socket.on('join', ({ userId }: { userId: string }) => {
      socket.join(userId);
      console.log(`User ${userId} joined their personal room`);
    
      // socket.join(userId);
      // console.log(`User ${userId} joined room`);
    });

    // Join conversation room
    socket.on('joinConversation', ({conversationId}:{conversationId: string}) => {
      socket.join(conversationId);
      console.log(`User joined conversation: ${conversationId}`);
    });

    // Send message
    socket.on('sendMessage', async (data: MessageData) => {
      try {
        const { conversationId, senderId, receiverId, message, messageType, attachments } = data;

        // Use message service to save message
        const newMessage = await messageService.sendMessage(
          conversationId,
          senderId,
          receiverId,
          message,
          messageType,
          attachments
        );

        if (!newMessage) {
          throw new Error('Failed to save message');
        }

        // Emit to conversation room
        io.to(conversationId).emit('newMessage', {
          ...newMessage.toObject(),
          timestamp: new Date(),
        });

        // Emit to receiver's personal room
        io.to(receiverId).emit('messageReceived', {
          _id: newMessage._id,
          conversationId,
          senderId,
          message,
          messageType,
          read: false,
          createdAt: newMessage.createdAt,
          timestamp: new Date(),
        });

      } catch (error: any) {
        console.error('Error sending message:', error);
        socket.emit('messageError', { 
          error: error.message || 'Failed to send message' 
        });
      }
    });

    // Message read receipt
    socket.on('markAsRead', async ({ messageId, userId, conversationId }: { 
      messageId: string; 
      userId: string; 
      conversationId: string;
    }) => {
      try {
        const message = await messageService.markAsRead(messageId, userId);
        
        if (message) {
          // Notify sender that message was read
          io.to(message.senderId.toString()).emit('messageRead', { 
            messageId, 
            conversationId,
            readAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Typing indicator
    socket.on('typing', (data: TypingData) => {
      const { conversationId, userId, isTyping } = data;
      socket.to(conversationId).emit('userTyping', {
        userId,
        isTyping,
        conversationId
      });
    });

    // Message deleted events
    socket.on('messageDeletedForMe', async ({ messageId, userId }: { 
      messageId: string; 
      userId: string;
    }) => {
      try {
        await messageService.deleteMessageForUser(messageId, userId);
        socket.emit('messageDeleted', { messageId, deletedForMe: true });
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    });

    socket.on('messageDeletedForEveryone', async ({ messageId, userId, conversationId }: { 
      messageId: string; 
      userId: string;
      conversationId: string;
    }) => {
      try {
        await messageService.deleteMessageForEveryone(messageId, userId);
        io.to(conversationId).emit('messageDeletedForEveryone', { 
          messageId,
          deletedBy: userId 
        });
      } catch (error) {
        console.error('Error deleting message for everyone:', error);
      }
    });

    // User disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

export default socketHandler;

// const socketHandler = (io) => {
//   io.on('connection', (socket) => {
//     console.log('User is connected', socket.id);

//     //   join user t their personal room
//     socket.on('join', (userId: string) => {
//       socket.join(userId);
//       console.log(`User  ${userId} joined room`);
//     });

//     //   join joinConversation room
//     socket.on('joinConversation', (conversationId: string) => {
//       socket.join(conversationId);
//       console.log(`User joined conversation: ${conversationId}`);
//     });

//     // Send message
//     socket.on('sendMessage', async (data) => {
//       const { conversationId, senderId, receiverId, message, messageType } =
//         data;

//       // Emit to conversation room
//       io.to(conversationId).emit('newMessage', {
//         conversationId,
//         senderId,
//         receiverId,
//         message,
//         messageType,
//         timestamp: new Date(),
//       });

//       // Emit to receiver's personal room
//       io.to(receiverId).emit('messageReceived', {
//         conversationId,
//         senderId,
//         message,
//         messageType,
//         timestamp: new Date(),
//       });
//     });

//     // Typing indicator
//     socket.on('typing', (data) => {
//       const { conversationId, userId, isTyping } = data;
//       socket.to(conversationId).emit('userTyping', {
//         userId,
//         isTyping,
//       });
//     });

//     // User disconnect
//     socket.on('disconnect', () => {
//       console.log('User disconnected:', socket.id);
//     });
//   });
// };

// export default socketHandler;
