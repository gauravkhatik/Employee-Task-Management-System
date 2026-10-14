import mongoose from 'mongoose';

let memoryServer;
let connectionPromise;

const resolveDatabaseName = (uri) => {
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\/+/, '');
    return pathname || 'roots_media';
  } catch (error) {
    return 'roots_media';
  }
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    const mongoUri = process.env.MONGO_URI;

    try {
      if (mongoUri) {
        const dbName = process.env.MONGO_DB_NAME || resolveDatabaseName(mongoUri);
        await mongoose.connect(mongoUri, { dbName });
        console.log(`MongoDB connected to Atlas (db: ${dbName})`);
        return mongoose.connection;
      }

      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGO_URI is required in production');
      }

      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'roots-media'
        }
      });

      await mongoose.connect(memoryServer.getUri());
      console.log('MongoDB connected to in-memory server');
      return mongoose.connection;
    } catch (error) {
      connectionPromise = null;
      console.error('MongoDB connection failed:', error.message);
      throw error;
    }
  })();

  return connectionPromise;
};

export default connectDB;
