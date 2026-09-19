import mongoose, { Schema } from 'mongoose';

const yarnSchema = new Schema({
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  materialType: { type: String, enum: ['COTTON', 'SILK', 'WOOL', 'LINEN', 'POLYESTER', 'MIXED', 'OTHER'], required: true },
  color: { type: String, required: true },
  weight: { type: Number, required: true, min: 0 },
  weightUnit: { type: String, enum: ['g', 'kg'], default: 'kg' },
  weightInKg: { type: Number, required: true, min: 0 },
  condition: { type: String, enum: ['NEW_LEFTOVER', 'GOOD', 'USED', 'MIXED'], required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  imageUrls: { type: [String], default: [] },
  basePricePerKg: { type: Number, required: true },
  qualityMultiplier: { type: Number, required: true },
  suggestedPrice: { type: Number, required: true },
  finalPrice: { type: Number, required: true },
  status: { type: String, enum: ['AVAILABLE', 'RESERVED', 'SOLD'], default: 'AVAILABLE' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model('Yarn', yarnSchema);