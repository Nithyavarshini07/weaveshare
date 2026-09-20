import mongoose from 'mongoose';

let databaseError = '';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI is missing');
}

  try {
    await mongoose.connect(uri);
    databaseError = '';
    console.log('MongoDB connected.');
  } catch (error: any) {
    databaseError = error?.message || String(error);
    console.error('MongoDB connection failed:', databaseError);
  }
}

export function databaseStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

export function databaseErrorMessage() {
  return databaseError;
}