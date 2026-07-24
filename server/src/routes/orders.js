import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';
import { PAYMENT_METHOD } from '../enums.js';

const router = Router();
const FREE_SHIPPING_ABOVE = 2999;
const SHIPPING_FEE = 99;

// Give back stock reserved for an order that then failed to be placed
const restoreStock = (items) =>
  Promise.all(
    items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } }).catch(() => {}))
  );

// POST /api/orders  { items: [{ productId, qty }], shipping: {...}, paymentMethod }
router.post('/', protect, async (req, res) => {
  const reserved = [];
  try {
    const { items, shipping, paymentMethod } = req.body;
    if (!items?.length) return res.status(400).json({ message: 'Your bag is empty' });

    const required = ['fullName', 'phone', 'address', 'city', 'state', 'pincode'];
    for (const field of required) {
      if (!shipping?.[field]?.trim()) {
        return res.status(400).json({ message: `Shipping ${field} is required` });
      }
    }

    // Price everything on the server — never trust client totals
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(400).json({ message: 'A product in your bag no longer exists' });
      const qty = Math.max(1, Math.min(10, Number(item.qty) || 1));
      if (product.stock < qty) {
        return res.status(400).json({ message: `${product.name} has only ${product.stock} in stock` });
      }
      orderItems.push({ product: product._id, name: product.name, price: product.price, qty });
    }

    const itemsTotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shippingFee = itemsTotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;

    // Reserve stock before creating the order, and only where enough is still
    // there. Checking stock and decrementing it as separate steps let two
    // customers buy the same last piece at the same moment.
    for (const item of orderItems) {
      const claimed = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } }
      );
      if (claimed.modifiedCount === 0) {
        await restoreStock(reserved);
        return res.status(409).json({ message: `${item.name} just sold out — please try again` });
      }
      reserved.push(item);
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shipping,
      itemsTotal,
      shippingFee,
      grandTotal: itemsTotal + shippingFee,
      paymentMethod: paymentMethod === PAYMENT_METHOD.UPI ? PAYMENT_METHOD.UPI : PAYMENT_METHOD.COD,
    });

    res.status(201).json(order);
  } catch (err) {
    // Don't strand reserved stock on an order that never got created
    await restoreStock(reserved);
    res.status(500).json({ message: 'Could not place order', error: err.message });
  }
});

// GET /api/orders/mine
router.get('/mine', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Could not load orders', error: err.message });
  }
});

export default router;
