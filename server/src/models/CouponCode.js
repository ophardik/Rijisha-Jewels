import mongoose from 'mongoose';

// A pool of pre-made 15%-off codes generated in the Etsy shop dashboard and
// pasted into the admin panel. Approving a reward pulls the next free code.
const couponCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reward: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', default: null },
    used: { type: Boolean, default: false }, // true once assigned to a reward
  },
  { timestamps: true }
);

export default mongoose.model('CouponCode', couponCodeSchema);
