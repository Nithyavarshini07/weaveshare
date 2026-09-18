import mongoose, { Schema } from 'mongoose';

const pricingConfigSchema = new Schema({
  material: { type: String, required: true, unique: true },
  basePricePerKg: { type: Number, required: true, min: 0 },
  multipliers: {
    NEW_LEFTOVER: { type: Number, default: 1 },
    GOOD: { type: Number, default: 0.9 },
    USED: { type: Number, default: 0.7 },
    MIXED: { type: Number, default: 0.6 },
  },
}, { timestamps: true });

export default mongoose.model('PricingConfig', pricingConfigSchema);