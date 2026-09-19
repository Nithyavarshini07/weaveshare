import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api, { resolveImageUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type CartYarn = {
  name: string;
  weight: number;
  weightUnit: string;
  imageUrls?: string[];
};

type CartItem = {
  id?: string;
  _id?: string;
  quantity: number;
  price: number;
  yarn: CartYarn;
};

type CartResponse = { items?: CartItem[] };

export default function CartPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await api.get<CartResponse>('/cart');
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'BUYER') void fetchCart();
  }, [fetchCart, user]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  const updateQty = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    await api.put(`/cart/${itemId}`, { quantity });
    await fetchCart();
  };

  const removeItem = async (itemId: string) => {
    await api.delete(`/cart/${itemId}`);
    toast.success('Item removed from cart');
    await fetchCart();
  };

  return (
    <div className="min-h-screen bg-[#dfeef0] p-4 md:p-6">
      <div className="mx-auto max-w-6xl card-shell p-6">
        <div className="mb-6 flex items-center justify-between"><h1 className="text-3xl font-black text-brand-dark">Cart</h1><Link to="/buyer" className="secondary-btn">Continue shopping</Link></div>
        {loading ? <div className="p-8 text-center text-slate-600">Loading cart...</div> : <div className="grid gap-6 lg:grid-cols-[1.5fr_0.75fr]">
          <div className="space-y-4">
            {items.length === 0 ? <div className="rounded-2xl bg-slate-50 p-6 text-slate-500">Your cart is empty.</div> : items.map((item) => {
              const itemId = item.id || item._id;
              return <div key={itemId} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center">
                <img src={resolveImageUrl(item.yarn.imageUrls?.[0])} data-fallback="false" onError={(event) => { if (event.currentTarget.dataset.fallback !== 'true') { event.currentTarget.dataset.fallback = 'true'; event.currentTarget.src = '/blue.jpg'; } }} alt={item.yarn.name} className="h-24 w-24 rounded-xl object-cover" />
                <div className="flex-1"><div className="font-black text-brand-dark">{item.yarn.name}</div><div className="text-sm text-slate-600">Weight: {item.yarn.weight} {item.yarn.weightUnit}</div><div className="text-sm text-slate-600">Price: ₹{item.price}</div></div>
                <div className="flex items-center gap-3"><button onClick={() => itemId && void updateQty(itemId, item.quantity - 1)} aria-label="Decrease quantity" className="rounded-full bg-slate-200 p-2"><Minus size={14} /></button><span>{item.quantity}</span><button onClick={() => itemId && void updateQty(itemId, item.quantity + 1)} aria-label="Increase quantity" className="rounded-full bg-slate-200 p-2"><Plus size={14} /></button></div>
                <div className="font-bold text-brand-dark">₹{item.price * item.quantity}</div>
                <button onClick={() => itemId && void removeItem(itemId)} aria-label={`Remove ${item.yarn.name}`} className="text-red-500"><Trash2 size={18} /></button>
              </div>;
            })}
          </div>
          <div className="rounded-[24px] bg-[#eaf9ff] p-5"><h2 className="text-xl font-black text-brand-dark">Order Summary</h2><div className="mt-4 space-y-3 text-slate-700"><div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div><div className="flex justify-between"><span>Delivery</span><span>₹0</span></div><div className="flex justify-between text-lg font-black text-brand-dark"><span>Total</span><span>₹{subtotal}</span></div></div><Link to="/checkout" className={`primary-btn mt-6 w-full ${items.length === 0 ? 'pointer-events-none opacity-50' : ''}`}>PROCEED TO CHECKOUT</Link></div>
        </div>}
      </div>
    </div>
  );
}
