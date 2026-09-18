import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);

  const fetchCart = async () => {
    const { data } = await api.get('/cart');
    setItems(data.items || []);
  };

  useEffect(() => {
    if (user?.role === 'BUYER') fetchCart();
  }, [user]);

  const total = items.reduce((sum, item) => sum + Number(item.yarn.finalPrice) * Number(item.quantity), 0);

  const updateQty = async (itemId: string, quantity: number) => {
    if (quantity <= 0) return;
    await api.put(`/cart/${itemId}`, { quantity });
    fetchCart();
  };

  const removeItem = async (itemId: string) => {
    await api.delete(`/cart/${itemId}`);
    toast.success('Item removed from cart');
    fetchCart();
  };

  return (
    <div className="min-h-screen bg-[#dfeef0] p-4 md:p-6">
      <div className="mx-auto max-w-6xl card-shell p-6">
        <h1 className="mb-6 text-3xl font-black text-brand-dark">Cart</h1>
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.75fr]">
          <div className="space-y-4">
            {items.length === 0 ? <div className="rounded-2xl bg-slate-50 p-6 text-slate-500">Your cart is empty.</div> : items.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center">
                <img src={item.yarn.imageUrls?.[0] || '/placeholder.jpg'} alt={item.yarn.name} className="h-24 w-24 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="font-black text-brand-dark">{item.yarn.name}</div>
                  <div className="text-sm text-slate-600">Weight: {item.yarn.weight} {item.yarn.weightUnit}</div>
                  <div className="text-sm text-slate-600">Price: ₹{item.yarn.finalPrice}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)} className="rounded-full bg-slate-200 px-2 py-1">-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)} className="rounded-full bg-slate-200 px-2 py-1">+</button>
                </div>
                <div className="font-bold text-brand-dark">₹{Number(item.yarn.finalPrice) * Number(item.quantity)}</div>
                <button onClick={() => removeItem(item.id)} className="text-sm font-semibold text-red-500">Remove</button>
              </div>
            ))}
          </div>

          <div className="rounded-[24px] bg-[#eaf9ff] p-5">
            <h2 className="text-xl font-black text-brand-dark">Order Summary</h2>
            <div className="mt-4 space-y-3 text-slate-700">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{total}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>₹0</span></div>
              <div className="flex justify-between text-lg font-black text-brand-dark"><span>Total</span><span>₹{total}</span></div>
            </div>
            <div className="mt-6 space-y-3">
              <Link to="/buyer" className="secondary-btn w-full">CONTINUE SHOPPING</Link>
              <button onClick={() => navigate('/checkout')} className="primary-btn w-full">PROCEED TO CHECKOUT</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
