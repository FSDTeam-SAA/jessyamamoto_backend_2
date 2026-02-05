import mongoose from 'mongoose';
import app from './app';
import config from './app/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import socketHandler from './app/helper/socketHandler';

const PORT = config.port;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin:'*', // Use your client URL from config
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Handle socket connections
socketHandler(io);
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
