import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  phone: String,
  role: { type: String, enum: ['SELLER', 'BUYER', 'ADMIN'], default: 'BUYER' },
  location: String,
  profileImage: String,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model('User', userSchema);