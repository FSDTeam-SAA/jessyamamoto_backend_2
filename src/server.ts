// import mongoose from 'mongoose';
// import app from './app';
// import config from './app/config';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import socketHandler from './app/helper/socketHandler';

// const PORT = config.port;

// const httpServer = createServer(app);

// const io = new Server(httpServer, {
//   cors: {
//     origin:'*', // Use your client URL from config
//     credentials: true,
//     methods: ['GET', 'POST']
//   },
//   transports: ['websocket', 'polling']
// });

// // Handle socket connections
// socketHandler(io);
// export const getIO = (): Server => {
//   if (!io) {
//     throw new Error('Socket.io not initialized');
//   }
//   return io;
// };
// const main = async () => {
//   try {
//     if (!config.mongoUri) {
//       throw new Error('MongoDB URI is not defined in environment variables.');
//     }

//     const mongo = await mongoose.connect(config.mongoUri);
//     console.log(`✅ MongoDB connected: ${mongo.connection.host}`);

//     httpServer.listen(PORT, () => {
//       console.log(`🚀 Server running on http://localhost:${PORT}`);
//     });
//   } catch (error: any) {
//     console.error('❌ Error starting server:', error.message || error);
//     process.exit(1);
//   }
// };

// main();

// server.ts - CORRECTED VERSION
import mongoose from 'mongoose';
import app from './app';
import config from './app/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import socketHandler from './app/helper/socketHandler';

const PORT = config.port;

const httpServer = createServer(app);

let io: Server; // Declare io variable

io = new Server(httpServer, {
  cors: {
    origin: '*', // Use your client URL from config
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Handle socket connections
socketHandler(io);

// Export getIO function
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

const main = async () => {
  try {
    if (!config.mongoUri) {
      throw new Error('MongoDB URI is not defined in environment variables.');
    }

    const mongo = await mongoose.connect(config.mongoUri);
    console.log(`✅ MongoDB connected: ${mongo.connection.host}`);

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error: any) {
    console.error('❌ Error starting server:', error.message || error);
    process.exit(1);
  }
};

main();
