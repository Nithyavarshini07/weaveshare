import mongoose, { Schema } from 'mongoose';

const cartItemSchema = new Schema({
  yarnId: { type: Schema.Types.ObjectId, ref: 'Yarn', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
}, { _id: true });

const cartSchema = new Schema({
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: { type: [cartItemSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('Cart', cartSchema);