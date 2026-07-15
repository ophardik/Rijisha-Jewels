import mongoose from 'mongoose';
import { COLLECTION_SLOTS } from '../enums.js';

// One document per admin-customisable home-page slot: the four collection
// cards (photo each) and the hero video. If no document exists for a slot,
// the frontend shows its built-in default (illustration / bundled video).
const homeCollectionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      unique: true,
      enum: COLLECTION_SLOTS,
    },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('HomeCollection', homeCollectionSchema);
