import mongoose, { Schema } from 'mongoose';

const orderItemSchema = new Schema({
  yarnId: { type: Schema.Types.ObjectId, ref: 'Yarn', required: true },
  name: { type: String, required: true },
  image: String,
  weight: Number,
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
}, { _id: true });

const orderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [orderItemSchema], required: true },
  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, default: 0 },
  total: { type: Number, required: true },
  deliveryAddress: { type: String, required: true },
  shippingName: String,
  shippingPhone: String,
  city: String,
  state: String,
  pincode: String,
  paymentMethod: { type: String, enum: ['COD', 'UPI'], default: 'COD' },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
  orderStatus: { type: String, enum: ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'], default: 'PENDING' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

orderSchema.virtual('status').get(function (this: { orderStatus: string }) { return this.orderStatus; });
orderSchema.virtual('totalAmount').get(function (this: { total: number }) { return this.total; });
export default mongoose.model('Order', orderSchema);