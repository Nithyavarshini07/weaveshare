import '../env.js';
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
  } catch (error: unknown) {
    const details = error as {
      name?: unknown;
      code?: unknown;
      codeName?: unknown;
      message?: unknown;
    };
    const sanitizedMessage = String(details.message || 'Unknown MongoDB error')
      .replaceAll(uri, '[REDACTED_MONGODB_URI]')
      .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, '[REDACTED_MONGODB_URI]');

    databaseError = 'MongoDB connection failed';
    console.error('MongoDB connection failed:', {
      name: String(details.name || 'Error'),
      ...(details.code !== undefined ? { code: details.code } : {}),
      ...(details.codeName !== undefined ? { codeName: details.codeName } : {}),
      message: sanitizedMessage,
    });
  }
}

export function databaseStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

export function databaseErrorMessage() {
  return databaseError;
}