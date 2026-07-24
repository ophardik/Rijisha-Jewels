import mongoose from 'mongoose';
import { REWARD_STATUS, REWARD_STATUSES } from '../enums.js';

// A customer's claim for the "photo review → 15% off next Etsy order" offer.
// One reward per review and one per Etsy order number keep it from being farmed.
const rewardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true, unique: true },
    etsyOrderNo: { type: String, required: true, trim: true },
    status: { type: String, enum: REWARD_STATUSES, default: REWARD_STATUS.PENDING },
    code: { type: String, default: '' }, // the Etsy coupon code, filled on approval
  },
  { timestamps: true }
);

// An order number is only "taken" by a live claim. A plain unique index would let
// anyone burn a stranger's order number with a bogus claim: rejecting it kept the
// number reserved forever, so the real customer could never claim their reward.
rewardSchema.index(
  { etsyOrderNo: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [REWARD_STATUS.PENDING, REWARD_STATUS.APPROVED] },
    },
  }
);

export default mongoose.model('Reward', rewardSchema);
