import mongoose from 'mongoose';
import { CATEGORIES, MEDIA_TYPES, MEDIA_TYPE } from '../enums.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true, enum: CATEGORIES },
    subCategory: { type: String, default: '' },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    mrp: { type: Number },
    tag: { type: String, default: '' },
    image: { type: String, default: '' }, // main thumbnail (/uploads/..) or external URL
    media: {
      type: [
        {
          url: { type: String, required: true },
          type: { type: String, enum: MEDIA_TYPES, default: MEDIA_TYPE.IMAGE },
        },
      ],
      default: [],
    }, // gallery: all photos & videos of the product
    art: { type: String, default: 'pendant' }, // fallback SVG illustration key on the client
    bg: { type: String, default: 'bg-a' }, // card background style
    rating: { type: Number, default: 4.8 },
    numReviews: { type: Number, default: 0 },
    stock: { type: Number, default: 25 },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
