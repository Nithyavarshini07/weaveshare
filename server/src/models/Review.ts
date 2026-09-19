import mongoose, { Schema } from 'mongoose';

const reviewSchema = new Schema({
  yarnId: { type: Schema.Types.ObjectId, ref: 'Yarn', required: true },
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 500 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

reviewSchema.index({ yarnId: 1, buyerId: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
