import 'dotenv/config';
import bcrypt from 'bcrypt';
import { connectDatabase } from './config/db.js';
import User from './models/User.js';
import Yarn from './models/Yarn.js';
import Category from './models/Category.js';
import PricingConfig from './models/PricingConfig.js';

const pricing = [
  ['COTTON', 180], ['SILK', 450], ['WOOL', 300], ['LINEN', 350], ['POLYESTER', 150], ['MIXED', 200], ['OTHER', 180],
] as const;

async function main() {
  await connectDatabase();
  await Promise.all([Yarn.deleteMany({}), Category.deleteMany({}), PricingConfig.deleteMany({}), User.deleteMany({})]);
  const passwordHash = await bcrypt.hash('password123', 10);
  const [admin, seller, buyer] = await User.create([
    { name: 'Admin User', email: 'admin@weaveshare.in', passwordHash, phone: '9999999999', role: 'ADMIN', location: 'Bengaluru' },
    { name: 'Rani Weavers', email: 'seller@weaveshare.in', passwordHash, phone: '9876543210', role: 'SELLER', location: 'Bhubaneswar' },
    { name: 'Meera Tailor', email: 'buyer@weaveshare.in', passwordHash, phone: '9123456789', role: 'BUYER', location: 'Cuttack' },
  ]);
  await Category.create(['Cotton', 'Silk', 'Wool', 'Linen', 'Polyester', 'Mixed'].map((name) => ({ name, description: `${name} yarn materials` })));
  await PricingConfig.create(pricing.map(([material, basePricePerKg]) => ({ material, basePricePerKg, multipliers: { NEW_LEFTOVER: 1, GOOD: 0.9, USED: 0.7, MIXED: 0.6 } })));
  await Yarn.create([
    { sellerId: seller._id, name: 'Cotton Yarn Bundle', materialType: 'COTTON', color: 'Blue', weight: 4, weightUnit: 'kg', weightInKg: 4, condition: 'GOOD', description: 'Premium cotton leftover for sewing and weaving.', location: 'Bhubaneswar', images: [], basePricePerKg: 180, qualityMultiplier: 0.9, suggestedPrice: 648, finalPrice: 648 },
    { sellerId: seller._id, name: 'Silk Yarn Pack', materialType: 'SILK', color: 'Maroon', weight: 2, weightUnit: 'kg', weightInKg: 2, condition: 'NEW_LEFTOVER', description: 'Soft silk yarn for festive fashion and accessories.', location: 'Bhubaneswar', images: [], basePricePerKg: 450, qualityMultiplier: 1, suggestedPrice: 900, finalPrice: 900 },
    { sellerId: seller._id, name: 'Wool Blend Yarn', materialType: 'WOOL', color: 'Grey', weight: 3, weightUnit: 'kg', weightInKg: 3, condition: 'GOOD', description: 'Warm wool blend for winter wear and crafts.', location: 'Bhubaneswar', images: [], basePricePerKg: 300, qualityMultiplier: 0.9, suggestedPrice: 810, finalPrice: 810 },
  ]);
  console.log(`Seeded ${admin.email}, ${seller.email}, and ${buyer.email}. Password: password123`);
  process.exit(0);
}
main().catch((error) => { console.error(error); process.exit(1); });
