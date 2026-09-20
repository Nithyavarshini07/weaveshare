import mongoose from 'mongoose';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/weaveshare';

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected.');
  } catch (error: any) {
    console.error('=== MONGODB CONNECTION ERROR ===');
    console.error(error);
    console.error('Message:', error?.message);
    console.error('Code:', error?.code);
    throw error;
  }
}

export function databaseStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}