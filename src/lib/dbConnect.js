// lib/dbConnect.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI
  ? process.env.MONGODB_URI
  : process.env.MONGODB_URI_LOCAL;

if (!MONGODB_URI) throw new Error('⚠️ MONGODB_URI not defined in .env');

let isConnected = false;

export const dbConnect = async () => {
  if (isConnected) return;

  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
};
