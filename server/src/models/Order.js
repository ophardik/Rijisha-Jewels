import mongoose from 'mongoose';
import { ORDER_STATUSES, ORDER_STATUS, PAYMENT_METHOD } from '../enums.js';

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        qty: { type: Number, required: true, min: 1 },
      },
    ],
    shipping: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    itemsTotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMethod: { type: String, default: PAYMENT_METHOD.COD },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: ORDER_STATUS.PLACED,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
