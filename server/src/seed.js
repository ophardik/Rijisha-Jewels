import Product from './models/Product.js';
import User from './models/User.js';
import { CATEGORY, PRODUCT_TAG } from './enums.js';
import { isProduction } from './config.js';

const products = [
  {
    name: 'Meera Jhumkas',
    slug: 'meera-jhumkas',
    category: CATEGORY.EARRINGS,
    subCategory: 'Jhumka',
    description:
      'Classic dome jhumkas handcrafted in 92.5% sterling silver, finished with a ring of freshwater-style pearls. Light on the ear, heavy on charm — the pair that goes from office wear to occasion wear effortlessly.',
    price: 2499,
    mrp: 3199,
    tag: PRODUCT_TAG.BESTSELLER,
    art: 'jhumka',
    bg: 'bg-a',
    rating: 4.9,
    numReviews: 214,
    stock: 40,
  },
  {
    name: 'Luna Bold Hoops',
    slug: 'luna-bold-hoops',
    category: CATEGORY.EARRINGS,
    subCategory: 'Hoops',
    description:
      'Statement hoops with a high-polish mirror finish and secure click closure. Anti-tarnish e-coated so they shine through daily wear, season after season.',
    price: 1899,
    mrp: null,
    tag: '',
    art: 'hoops',
    bg: 'bg-b',
    rating: 4.8,
    numReviews: 167,
    stock: 55,
  },
  {
    name: 'Tara Layered Necklace',
    slug: 'tara-layered-necklace',
    category: CATEGORY.NECKLACES,
    subCategory: 'Layered',
    description:
      'Three delicate silver chains fall in perfect graduation, anchored by a pearl, a gemstone and a hand-cut kite drop. One necklace, the effect of three.',
    price: 3799,
    mrp: 4499,
    tag: PRODUCT_TAG.NEW,
    art: 'layered',
    bg: 'bg-c',
    rating: 4.9,
    numReviews: 98,
    stock: 22,
  },
  {
    name: 'Ira Pearl Pendant',
    slug: 'ira-pearl-pendant',
    category: CATEGORY.NECKLACES,
    subCategory: 'Pendant',
    description:
      'A sculpted teardrop of sterling silver cradles a luminous pearl centre on a fine ball chain. Minimal enough for every day, special enough for evenings.',
    price: 2899,
    mrp: null,
    tag: '',
    art: 'pendant',
    bg: 'bg-d',
    rating: 4.8,
    numReviews: 143,
    stock: 35,
  },
  {
    name: 'Noor Chandbalis',
    slug: 'noor-chandbalis',
    category: CATEGORY.EARRINGS,
    subCategory: 'Chandbali',
    description:
      'Crescent-moon chandbalis with a gemstone heart and a fringe of dancing pearls. Handcrafted for festive nights, weddings and every sangeet in between.',
    price: 3299,
    mrp: 3899,
    tag: PRODUCT_TAG.FESTIVE,
    art: 'chandbali',
    bg: 'bg-b',
    rating: 4.9,
    numReviews: 186,
    stock: 18,
  },
  {
    name: 'Aabha Choker',
    slug: 'aabha-choker',
    category: CATEGORY.NECKLACES,
    subCategory: 'Choker',
    description:
      'A sleek silver collar set with three gemstones and a single pearl drop. Sits close to the neckline — architectural, modern, unmissable.',
    price: 4199,
    mrp: null,
    tag: '',
    art: 'choker',
    bg: 'bg-a',
    rating: 4.7,
    numReviews: 76,
    stock: 15,
  },
  {
    name: 'Kaya Crystal Drops',
    slug: 'kaya-crystal-drops',
    category: CATEGORY.EARRINGS,
    subCategory: 'Drops',
    description:
      'Elongated oval drops framing a hand-set crystal, ending in a single pearl. Movement in every step — these are earrings that catch light and attention.',
    price: 2199,
    mrp: 2699,
    tag: '',
    art: 'drops',
    bg: 'bg-d',
    rating: 4.8,
    numReviews: 129,
    stock: 44,
  },
  {
    name: 'Chandni Moon Pendant',
    slug: 'chandni-moon-pendant',
    category: CATEGORY.NECKLACES,
    subCategory: 'Pendant',
    description:
      'A crescent moon in brushed sterling silver, scattered with tiny gemstones like stars. Our most-gifted piece — because everyone has someone who loves the moon.',
    price: 2599,
    mrp: 3099,
    tag: PRODUCT_TAG.BESTSELLER,
    art: 'moon',
    bg: 'bg-c',
    rating: 4.9,
    numReviews: 201,
    stock: 30,
  },
  {
    name: 'Kiara Kada Bangle',
    slug: 'kiara-kada-bangle',
    category: CATEGORY.BRACELETS,
    subCategory: 'Bangle',
    description:
      'A sleek sterling silver kada with three hand-set gemstones and a single pearl accent. Solid, smooth and made to be stacked — or stunning alone.',
    price: 2799,
    mrp: 3299,
    tag: PRODUCT_TAG.NEW,
    art: 'bangle',
    bg: 'bg-b',
    rating: 4.8,
    numReviews: 87,
    stock: 26,
  },
  {
    name: 'Zoya Charm Bracelet',
    slug: 'zoya-charm-bracelet',
    category: CATEGORY.BRACELETS,
    subCategory: 'Charm',
    description:
      'A delicate silver chain strung with a pearl, a gemstone and a tiny moon charm. Light as a whisper, personal as a signature.',
    price: 2299,
    mrp: 2799,
    tag: '',
    art: 'charm',
    bg: 'bg-a',
    rating: 4.9,
    numReviews: 112,
    stock: 34,
  },
  {
    name: 'Payal Silver Anklets',
    slug: 'payal-silver-anklets',
    category: CATEGORY.ANTIQUE,
    subCategory: 'Anklet',
    description:
      'A classic double-strand payal in pure silver with tiny ghungroo bells that sing softly with every step. Sold as a pair, loved for a lifetime.',
    price: 1999,
    mrp: null,
    tag: PRODUCT_TAG.BESTSELLER,
    art: 'anklet',
    bg: 'bg-d',
    rating: 4.9,
    numReviews: 156,
    stock: 40,
  },
  {
    name: 'Ishta Maang Tikka',
    slug: 'ishta-maang-tikka',
    category: CATEGORY.ANTIQUE,
    subCategory: 'Maang Tikka',
    description:
      'A regal maang tikka with a gemstone-set teardrop and a fringe of pearls on a fine silver chain. The finishing touch for festive and bridal looks.',
    price: 2499,
    mrp: 2999,
    tag: PRODUCT_TAG.FESTIVE,
    art: 'tikka',
    bg: 'bg-c',
    rating: 4.8,
    numReviews: 64,
    stock: 20,
  },
];

export async function seedProducts() {
  // The 'ornaments' category was renamed to 'antique' — migrate any old documents.
  const renamed = await Product.updateMany({ category: 'ornaments' }, { category: CATEGORY.ANTIQUE });
  if (renamed.modifiedCount > 0) {
    console.log(`Migrated ${renamed.modifiedCount} products from 'ornaments' to 'antique'`);
  }

  // Insert any catalog piece that isn't in the database yet (matched by slug),
  // so new seed items appear even in an already-populated database.
  const existing = new Set((await Product.find({}, 'slug')).map((p) => p.slug));
  const missing = products.filter((p) => !existing.has(p.slug));
  if (missing.length > 0) {
    await Product.insertMany(missing);
    console.log(`Seeded ${missing.length} products: ${missing.map((p) => p.name).join(', ')}`);
  }
  await seedAdmin();
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  // No defaults: a fallback email/password here would be public in the repo, and
  // anyone could log in as admin on a deploy that forgot to set these.
  if (!email || !password) {
    if (isProduction) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in production');
    }
    console.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set — no admin account seeded');
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    // Never grant isAdmin to an account we didn't create. Promoting on startup
    // would let anyone register this email and become admin on the next restart.
    if (!existing.isAdmin) {
      console.warn(
        `ADMIN_EMAIL ${email} belongs to a non-admin account — refusing to promote it. ` +
          'Grant admin in the database by hand if this is genuinely your account.'
      );
    }
    return;
  }

  await User.create({ name: 'Rijisha Admin', email, password, isAdmin: true });
  console.log(`Created admin account: ${email}`);
}
