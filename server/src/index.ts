import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { isValidObjectId } from 'mongoose';
import { upload, publicUploadPath } from './lib/upload.js';
import { connectDatabase, databaseStatus } from './config/db.js';
import User from './models/User.js';
import Yarn from './models/Yarn.js';
import Cart from './models/Cart.js';
import Order from './models/Order.js';
import Category from './models/Category.js';
import PricingConfig from './models/PricingConfig.js';
import { authenticateToken, authorizeRoles, type AuthRequest } from './middleware/auth.js';
import { getBasePrice, getQualityMultiplier, normalizeWeight, type MaterialType, type YarnCondition } from './utils/pricing.js';

const app = express();
const port = Number(process.env.PORT || 5000);
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
//const uploadDir = path.join(process.cwd(), 'uploads', 'yarn');
//if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const userView = (user: any) => ({ id: user._id.toString(), name: user.name, email: user.email, role: user.role, location: user.location, phone: user.phone, profileImage: user.profileImage });
const tokenFor = (user: any) => jwt.sign({ userId: user._id.toString(), email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
const validId = (value: string) => isValidObjectId(value) ? value : null;
const enumValue = (value: unknown) => String(value || '').trim().toUpperCase().replace(/\s+/g, '_');

app.get('/api/health', (_req, res) => res.json({ ok: true, message: 'WeaveShare server is running', database: databaseStatus() }));

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, location, profileImage } = req.body;
    const normalizedRole = enumValue(role);
    if (!name || !email || !password || !['SELLER', 'BUYER'].includes(normalizedRole)) return res.status(400).json({ message: 'Name, email, password and a valid role are required.' });
    const normalizedEmail = String(email).trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'A user with this email already exists.' });
    const user = await User.create({ name, email: normalizedEmail, passwordHash: await bcrypt.hash(String(password), 10), phone, role: normalizedRole, location, profileImage });
    return res.status(201).json({ token: tokenFor(user), user: userView(user) });
  } catch (error) { console.error('Register error:', error); return res.status(500).json({ message: 'Registration failed.' }); }
});
app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: String(req.body.email || '').trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.passwordHash))) return res.status(401).json({ message: 'Invalid login credentials.' });
    const selectedRole = enumValue(req.body.role || user.role);
    if (user.role !== 'ADMIN' && selectedRole !== user.role) return res.status(401).json({ message: 'This account is not registered for the selected role.' });
    return res.json({ token: tokenFor(user), user: userView(user) });
  } catch (error) { console.error('Login error:', error); return res.status(500).json({ message: 'Login failed.' }); }
});
app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => { const user = await User.findById(req.user!.userId); if (!user) return res.status(404).json({ message: 'User not found.' }); return res.json({ user: userView(user) }); });
app.post('/api/auth/logout', authenticateToken, (_req, res) => res.json({ message: 'Logged out successfully.' }));
app.get('/api/categories', async (_req, res) => res.json(await Category.find().sort({ name: 1 })));

app.post('/api/yarns', authenticateToken, authorizeRoles('SELLER'), upload.array('images', 5), async (req: AuthRequest, res) => {
  try {
    const { name, materialType, color, weight, weightUnit, condition, description, location, finalPrice } = req.body;
    const material = enumValue(materialType) as MaterialType;
    const yarnCondition = enumValue(condition) as YarnCondition;
    const weightValue = Number(weight);
    const unit = String(weightUnit || 'kg').toLowerCase();
    if (!name || !materialType || !color || !weight || !condition || !description || !location) return res.status(400).json({ message: 'All listing fields are required.' });
    if (!Number.isFinite(weightValue) || weightValue <= 0 || !['g', 'kg'].includes(unit)) return res.status(400).json({ message: 'Invalid weight value.' });
    if (!['COTTON', 'SILK', 'WOOL', 'LINEN', 'POLYESTER', 'MIXED', 'OTHER'].includes(material) || !['NEW_LEFTOVER', 'GOOD', 'USED', 'MIXED'].includes(yarnCondition)) return res.status(400).json({ message: 'Invalid material or condition.' });
    const weightInKg = normalizeWeight(weightValue, unit);
    const config: any = await PricingConfig.findOne({ material });
    const basePricePerKg = config?.basePricePerKg ?? getBasePrice(material);
    const qualityMultiplier = config?.multipliers?.[yarnCondition] ?? getQualityMultiplier(yarnCondition);
    const suggestedPrice = Number((weightInKg * basePricePerKg * qualityMultiplier).toFixed(2));
    const files = Array.isArray(req.files) ? req.files as Express.Multer.File[] : [];
    const images = files.map((file) => `${publicUploadPath}/${file.filename}`);
    const listing = await Yarn.create({ sellerId: req.user!.userId, name, materialType: material, color, weight: weightValue, weightUnit: unit, weightInKg, condition: yarnCondition, description, location, images, basePricePerKg, qualityMultiplier, suggestedPrice, finalPrice: Number(finalPrice) > 0 ? Number(finalPrice) : suggestedPrice });
    return res.status(201).json({ message: 'Yarn listed successfully.', listing });
  } catch (error) { console.error('Create yarn error:', error); return res.status(500).json({ message: 'Failed to create yarn listing.' }); }
});
app.get('/api/yarns', async (req, res) => {
  const query: any = { status: { $ne: 'SOLD' } };
  const search = String(req.query.search || '').trim();
  if (search) query.$or = [{ name: new RegExp(search, 'i') }, { materialType: new RegExp(search, 'i') }, { color: new RegExp(search, 'i') }, { location: new RegExp(search, 'i') }];
  if (req.query.material) query.materialType = enumValue(req.query.material);
  if (req.query.condition) query.condition = enumValue(req.query.condition);
  if (req.query.location) query.location = new RegExp(String(req.query.location), 'i');
  if (req.query.minPrice || req.query.maxPrice) query.finalPrice = { ...(req.query.minPrice ? { $gte: Number(req.query.minPrice) } : {}), ...(req.query.maxPrice ? { $lte: Number(req.query.maxPrice) } : {}) };
  if (req.query.minWeight || req.query.maxWeight) query.weightInKg = { ...(req.query.minWeight ? { $gte: Number(req.query.minWeight) } : {}), ...(req.query.maxWeight ? { $lte: Number(req.query.maxWeight) } : {}) };
  const sort = req.query.sort === 'lowest' ? { finalPrice: 1 } : req.query.sort === 'highest' ? { finalPrice: -1 } : { createdAt: -1 };
  return res.json(await Yarn.find(query).populate('sellerId', 'name email location').sort(sort as any));
});
app.get('/api/yarns/my', authenticateToken, authorizeRoles('SELLER'), async (req: AuthRequest, res) => res.json(await Yarn.find({ sellerId: req.user!.userId }).sort({ createdAt: -1 })));
app.get('/api/yarns/:id', async (req, res) => { const yarn = validId(req.params.id) && await Yarn.findById(req.params.id).populate('sellerId', 'name email location'); if (!yarn) return res.status(404).json({ message: 'Yarn not found.' }); return res.json(yarn); });
app.put('/api/yarns/:id', authenticateToken, authorizeRoles('SELLER'), async (req: AuthRequest, res) => {
  const listing: any = validId(req.params.id) && await Yarn.findById(req.params.id);
  if (!listing) return res.status(404).json({ message: 'Listing not found.' });
  if (listing.sellerId.toString() !== req.user!.userId) return res.status(403).json({ message: 'You can only update your own listings.' });
  const update: any = { ...req.body };
  if (update.materialType) update.materialType = enumValue(update.materialType);
  if (update.condition) update.condition = enumValue(update.condition);
  if (update.weight || update.weightUnit) { update.weight = Number(update.weight || listing.weight); update.weightUnit = update.weightUnit || listing.weightUnit; update.weightInKg = normalizeWeight(update.weight, update.weightUnit); }
  const updated = await Yarn.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  return res.json({ message: 'Listing updated.', listing: updated });
});
app.delete('/api/yarns/:id', authenticateToken, authorizeRoles('SELLER'), async (req: AuthRequest, res) => { const listing: any = validId(req.params.id) && await Yarn.findById(req.params.id); if (!listing) return res.status(404).json({ message: 'Listing not found.' }); if (listing.sellerId.toString() !== req.user!.userId) return res.status(403).json({ message: 'You can only delete your own listings.' }); await listing.deleteOne(); return res.json({ message: 'Listing removed.' }); });
app.post('/api/yarns/:id/images', authenticateToken, authorizeRoles('SELLER'), upload.array('images', 5), async (req: AuthRequest, res) => { const listing: any = validId(req.params.id) && await Yarn.findById(req.params.id); if (!listing) return res.status(404).json({ message: 'Yarn not found.' }); if (listing.sellerId.toString() !== req.user!.userId) return res.status(403).json({ message: 'Unauthorized.' }); const files = Array.isArray(req.files) ? req.files as Express.Multer.File[] : []; listing.images.push(...files.map((file) => `${publicUploadPath}/${file.filename}`)); await listing.save(); return res.json({ message: 'Images uploaded.', listing }); });

async function cartView(buyerId: string) {
  const cart: any = await Cart.findOne({ buyerId }).populate('items.yarnId');
  return { ...(cart?.toObject() || { items: [] }), items: cart?.items.map((item: any) => ({ ...item.toObject(), id: item._id, yarn: item.yarnId })) || [] };
}
app.get('/api/cart', authenticateToken, authorizeRoles('BUYER'), async (req: AuthRequest, res) => res.json(await cartView(req.user!.userId)));
app.post('/api/cart', authenticateToken, authorizeRoles('BUYER'), async (req: AuthRequest, res) => {
  const yarn: any = validId(req.body.yarnId) && await Yarn.findById(req.body.yarnId);
  if (!yarn) return res.status(404).json({ message: 'Yarn not found.' });
  let cart: any = await Cart.findOne({ buyerId: req.user!.userId });
  if (!cart) cart = await Cart.create({ buyerId: req.user!.userId, items: [] });
  const cartYarns: any[] = await Yarn.find({ _id: { $in: cart.items.map((item: any) => item.yarnId) } }, 'sellerId');
  if (cartYarns.some((item) => item.sellerId.toString() !== yarn.sellerId.toString())) return res.status(409).json({ message: 'Your cart contains items from another seller. Please complete or clear your current cart before adding this item.' });
  const existing: any = cart.items.find((item: any) => item.yarnId.toString() === yarn._id.toString());
  if (existing) existing.quantity += Math.max(1, Number(req.body.quantity || 1)); else cart.items.push({ yarnId: yarn._id, quantity: Math.max(1, Number(req.body.quantity || 1)), price: yarn.finalPrice });
  await cart.save(); return res.status(201).json({ message: 'Item added to cart.', ...(await cartView(req.user!.userId)) });
});
app.put('/api/cart/:itemId', authenticateToken, authorizeRoles('BUYER'), async (req: AuthRequest, res) => { const cart: any = await Cart.findOne({ buyerId: req.user!.userId }); const item: any = cart?.items.id(req.params.itemId); if (!item) return res.status(404).json({ message: 'Cart item not found.' }); item.quantity = Math.max(1, Number(req.body.quantity)); await cart.save(); return res.json({ message: 'Cart updated.', ...(await cartView(req.user!.userId)) }); });
app.delete('/api/cart/:itemId', authenticateToken, authorizeRoles('BUYER'), async (req: AuthRequest, res) => { const cart: any = await Cart.findOne({ buyerId: req.user!.userId }); const item: any = cart?.items.id(req.params.itemId); if (!item) return res.status(404).json({ message: 'Cart item not found.' }); item.deleteOne(); await cart.save(); return res.json({ message: 'Cart item removed.', ...(await cartView(req.user!.userId)) }); });
app.post('/api/cart/clear', authenticateToken, authorizeRoles('BUYER'), async (req: AuthRequest, res) => { await Cart.findOneAndUpdate({ buyerId: req.user!.userId }, { items: [] }); return res.json({ message: 'Cart cleared.' }); });

app.post('/api/orders', authenticateToken, authorizeRoles('BUYER'), async (req: AuthRequest, res) => {
  const cart: any = await Cart.findOne({ buyerId: req.user!.userId }).populate('items.yarnId');
  if (!cart || !cart.items.length) return res.status(400).json({ message: 'Your cart is empty.' });
  const yarns: any[] = cart.items.map((item: any) => item.yarnId);
  if (yarns.some((yarn) => yarn.status !== 'AVAILABLE')) return res.status(400).json({ message: 'One or more yarn listings are no longer available.' });
  if (req.body.paymentMethod === 'UPI') return res.status(400).json({ message: 'UPI payment integration coming soon.' });
  const subtotal = cart.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const order = await Order.create({ orderNumber: `WS-${Date.now()}`, buyerId: req.user!.userId, sellerId: yarns[0].sellerId, items: cart.items.map((item: any) => ({ yarnId: item.yarnId._id, name: item.yarnId.name, image: item.yarnId.images[0], weight: item.yarnId.weight, quantity: item.quantity, price: item.price })), subtotal, deliveryCharge: 0, total: subtotal, deliveryAddress: req.body.shippingAddress || '', shippingName: req.body.shippingName, shippingPhone: req.body.shippingPhone, city: req.body.city, state: req.body.state, pincode: req.body.pincode, paymentMethod: 'COD' });
  await Promise.all(yarns.map((yarn) => Yarn.findByIdAndUpdate(yarn._id, { status: 'RESERVED' }))); await Cart.findByIdAndUpdate(cart._id, { items: [] });
  return res.status(201).json({ message: 'Order created successfully.', order });
});
app.get('/api/orders', authenticateToken, async (req: AuthRequest, res) => { const where = req.user!.role === 'ADMIN' ? {} : req.user!.role === 'SELLER' ? { sellerId: req.user!.userId } : { buyerId: req.user!.userId }; return res.json(await Order.find(where).sort({ createdAt: -1 })); });
app.get('/api/orders/my', authenticateToken, async (req: AuthRequest, res) => { const where = req.user!.role === 'SELLER' ? { sellerId: req.user!.userId } : { buyerId: req.user!.userId }; return res.json(await Order.find(where).sort({ createdAt: -1 })); });
app.get('/api/orders/:id', authenticateToken, async (req: AuthRequest, res) => { const order: any = validId(req.params.id) && await Order.findById(req.params.id); if (!order) return res.status(404).json({ message: 'Order not found.' }); if (req.user!.role !== 'ADMIN' && order.buyerId.toString() !== req.user!.userId && order.sellerId.toString() !== req.user!.userId) return res.status(403).json({ message: 'This order does not belong to you.' }); return res.json(order); });
app.put('/api/orders/:id/status', authenticateToken, async (req: AuthRequest, res) => { const order: any = validId(req.params.id) && await Order.findById(req.params.id); if (!order) return res.status(404).json({ message: 'Order not found.' }); if (req.user!.role === 'SELLER' && order.sellerId.toString() !== req.user!.userId) return res.status(403).json({ message: 'Only the seller can update this status.' }); if (req.user!.role === 'BUYER') return res.status(403).json({ message: 'Buyers cannot update order status.' }); const status = enumValue(req.body.status); if (!['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) return res.status(400).json({ message: 'Invalid order status.' }); order.orderStatus = status; await order.save(); if (status === 'DELIVERED') await Yarn.updateMany({ _id: { $in: order.items.map((item: any) => item.yarnId) } }, { status: 'SOLD' }); if (status === 'CANCELLED') await Yarn.updateMany({ _id: { $in: order.items.map((item: any) => item.yarnId) } }, { status: 'AVAILABLE' }); return res.json({ message: 'Order status updated.', order }); });

app.get('/api/admin/users', authenticateToken, authorizeRoles('ADMIN'), async (_req, res) => res.json(await User.find().select('-passwordHash').sort({ createdAt: -1 })));
app.get('/api/admin/listings', authenticateToken, authorizeRoles('ADMIN'), async (_req, res) => res.json(await Yarn.find().populate('sellerId', 'name email').sort({ createdAt: -1 })));
app.get('/api/admin/orders', authenticateToken, authorizeRoles('ADMIN'), async (_req, res) => res.json(await Order.find().sort({ createdAt: -1 })));
app.get('/api/admin/pricing', authenticateToken, authorizeRoles('ADMIN'), async (_req, res) => res.json(await PricingConfig.find().sort({ material: 1 })));
app.put('/api/admin/pricing', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => { const material = enumValue(req.body.materialType || req.body.material); const config = await PricingConfig.findOneAndUpdate({ material }, { material, basePricePerKg: Number(req.body.basePricePerKg), multipliers: req.body.multipliers }, { new: true, upsert: true, runValidators: true }); return res.json({ message: 'Pricing updated.', config }); });

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => res.status(400).json({ message: err?.message || 'Unexpected error.' }));
// Connect to the database
connectDatabase();

// Export the app for Vercel
export default app;

// Only listen locally if not on Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
}