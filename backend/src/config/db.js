import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer;

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
  const mongoUri = process.env.MONGO_URI;

  try {
    if (mongoUri) {
      const dbName = process.env.MONGO_DB_NAME || resolveDatabaseName(mongoUri);
      await mongoose.connect(mongoUri, { dbName });
      console.log(`MongoDB connected to Atlas (db: ${dbName})`);
      return;
    }

    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'roots-media'
      }
    });

    const uri = memoryServer.getUri();
    await mongoose.connect(uri);
    console.log(`MongoDB connected to in-memory server: ${uri}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

export default connectDB;
