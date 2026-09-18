import mongoose from 'mongoose';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/weaveshare';
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected.');
  } catch (error) {
    console.error('MongoDB connection failed. Please make sure MongoDB is running.', error);
    throw new Error('MongoDB connection failed. Please make sure MongoDB is running.');
  }
}

export function databaseStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}