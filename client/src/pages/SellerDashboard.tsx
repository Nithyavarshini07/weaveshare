import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalListings: 0, availableYarn: 0, ordersReceived: 0, totalEarnings: 0 });
  const [form, setForm] = useState({
    name: '',
    materialType: 'COTTON',
    color: '',
    weight: '',
    weightUnit: 'kg',
    condition: 'GOOD',
    description: '',
    location: '',
    price: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [preview, setPreview] = useState<string[]>([]);

  const fetchSellerData = async () => {
    const [{ data: myListings }, { data: orders }] = await Promise.all([api.get('/yarns/my'), api.get('/orders/my')]);
    const deliveredOrders = orders.filter((order: any) => (order.orderStatus || order.status) === 'DELIVERED');
    setListings(myListings);
    setStats({
      totalListings: myListings.length,
      availableYarn: myListings.filter((y: any) => y.status === 'AVAILABLE').length,
      ordersReceived: orders.length,
      totalEarnings: deliveredOrders.reduce((sum: number, order: any) => sum + order.items.reduce((itemSum: number, item: any) => itemSum + Number(item.price || 0) * Number(item.quantity || 0), 0), 0),
    });
  };

  useEffect(() => {
    fetchSellerData();
  }, [user]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImages(files);
    setPreview(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append('name', form.name);
      payload.append('materialType', form.materialType);
      payload.append('color', form.color);
      payload.append('weight', form.weight);
      payload.append('weightUnit', form.weightUnit);
      payload.append('condition', form.condition);
      payload.append('description', form.description);
      payload.append('location', form.location);
      payload.append('price', form.price);
      images.forEach((image) => payload.append('images', image));

      const { data } = await api.post('/yarns', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(data.message);
      setForm({ name: '', materialType: 'COTTON', color: '', weight: '', weightUnit: 'kg', condition: 'GOOD', description: '', location: '', price: '' });
      setImages([]);
      setPreview([]);
      await fetchSellerData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to create listing');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#dfeef0] p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex items-center justify-between rounded-[28px] bg-white p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="WeaveShare" className="h-12 w-auto" />
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-slate-700">Dashboard</span>
            <span className="text-slate-700">My Listings</span>
            <button onClick={handleLogout} className="secondary-btn px-3 py-2 text-sm">Logout</button>
          </div>
        </nav>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Total Listings', value: stats.totalListings },
            { label: 'Available Yarn', value: stats.availableYarn },
            { label: 'Orders Received', value: stats.ordersReceived },
            { label: 'Total Earnings', value: `₹${stats.totalEarnings}` },
          ].map((card) => (
            <div key={card.label} className="card-shell p-5">
              <div className="text-sm text-slate-500">{card.label}</div>
              <div className="mt-3 text-3xl font-black text-brand-dark">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="card-shell p-5">
            <h3 className="mb-4 text-2xl font-black text-brand-dark">My Listings</h3>
            <div className="space-y-3">
              {listings.length ? listings.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                  <div>
                    <div className="font-bold text-slate-800">{item.name}</div>
                    <div className="text-sm text-slate-500">{item.materialType} • {item.color} • {item.weight} {item.weightUnit}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-brand-teal">₹{item.finalPrice}</div>
                    <div className="text-xs text-slate-500">{item.status}</div>
                  </div>
                </div>
              )) : <div className="text-slate-500">No listings yet.</div>}
            </div>
          </div>

          <div className="card-shell p-5">
            <h3 className="mb-4 text-2xl font-black text-brand-dark">LIST YOUR YARN</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="soft-input" placeholder="Yarn Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <div className="grid gap-3 md:grid-cols-2">
                <select className="soft-input" value={form.materialType} onChange={(e) => setForm({ ...form, materialType: e.target.value })}>
                  {['COTTON', 'SILK', 'WOOL', 'LINEN', 'POLYESTER', 'MIXED', 'OTHER'].map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <input className="soft-input" placeholder="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} required />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input className="soft-input" type="number" step="0.1" placeholder="Weight" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} required />
                <select className="soft-input" value={form.weightUnit} onChange={(e) => setForm({ ...form, weightUnit: e.target.value })}>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <select className="soft-input" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                  {['NEW_LEFTOVER', 'GOOD', 'USED', 'MIXED'].map((condition) => <option key={condition} value={condition}>{condition}</option>)}
                </select>
                <input className="soft-input" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
              </div>
              <textarea className="soft-input min-h-[100px] rounded-[20px]" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              <input className="soft-input" type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="block w-full rounded-full border border-dashed border-slate-300 bg-slate-50 p-3 text-sm" />
              {preview.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {preview.map((image, index) => <img key={image + index} src={image} alt="Preview" className="h-20 w-full rounded-xl object-cover" />)}
                </div>
              )}
              <button type="submit" className="primary-btn w-full">Create Listing</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
