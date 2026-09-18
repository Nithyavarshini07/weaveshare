import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../lib/api';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'COD',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/orders', {
        shippingName: form.fullName,
        shippingPhone: form.phone,
        shippingAddress: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        paymentMethod: form.paymentMethod,
      });
      toast.success('Order placed successfully');
      navigate('/buyer');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to place order');
    }
  };

  return (
    <div className="min-h-screen bg-[#dfeef0] p-4 md:p-6">
      <div className="mx-auto max-w-5xl card-shell p-6">
        <h1 className="mb-6 text-3xl font-black text-brand-dark">Checkout</h1>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="soft-input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full Name" required />
            <input className="soft-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" required />
            <input className="soft-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" required />
            <div className="grid gap-4 md:grid-cols-2">
              <input className="soft-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" required />
              <input className="soft-input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" required />
            </div>
            <input className="soft-input" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="Pincode" required />

            <div className="space-y-3">
              <div className="font-bold text-brand-dark">Payment Methods</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2"><input type="radio" name="payment" checked={form.paymentMethod === 'COD'} onChange={() => setForm({ ...form, paymentMethod: 'COD' })} /> Cash on Delivery</label>
                <label className="flex items-center gap-2 opacity-60"><input type="radio" name="payment" checked={form.paymentMethod === 'UPI'} onChange={() => setForm({ ...form, paymentMethod: 'UPI' })} /> UPI (coming soon)</label>
              </div>
            </div>

            <button type="submit" className="primary-btn w-full">Place Order</button>
          </form>

          <div className="rounded-[24px] bg-[#eaf9ff] p-5">
            <h2 className="text-xl font-black text-brand-dark">Order Summary</h2>
            <div className="mt-4 text-sm text-slate-700">
              <p>Subtotal: ₹0</p>
              <p>Delivery: ₹0</p>
              <p className="mt-3 text-lg font-black text-brand-dark">Total: ₹0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
