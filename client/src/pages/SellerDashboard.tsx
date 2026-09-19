import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api, { resolveImageUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    availableYarn: 0,
    ordersReceived: 0,
    totalEarnings: 0,
  });
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
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSellerData = async () => {
    const [{ data: myListings }, { data: orders }] = await Promise.all([
      api.get('/yarns/my'),
      api.get('/orders/my'),
    ]);
    const deliveredOrders = orders.filter(
      (order: any) => (order.orderStatus || order.status) === 'DELIVERED'
    );
    setListings(myListings);
    setStats({
      totalListings: myListings.length,
      availableYarn: myListings.filter((y: any) => y.status === 'AVAILABLE').length,
      ordersReceived: orders.length,
      totalEarnings: deliveredOrders.reduce(
        (sum: number, order: any) =>
          sum +
          order.items.reduce(
            (itemSum: number, item: any) =>
              itemSum + Number(item.price || 0) * Number(item.quantity || 0),
            0
          ),
        0
      ),
    });
  };

  useEffect(() => {
    fetchSellerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImages(files);
    setPreview(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
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
      // ✅ FIX: backend expects `finalPrice`, not `price`
      payload.append('finalPrice', form.price);
      // ✅ FIX: field name must match upload.array('images', 5) on the server
      images.forEach((image) => payload.append('images', image));

      // Let the browser set the multipart boundary automatically —
      // manually setting 'Content-Type' can break multer parsing in some cases.
      const { data } = await api.post('/yarns', payload);

      toast.success(data.message || 'Listing created');
      setForm({
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
      setImages([]);
      setPreview([]);
      await fetchSellerData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (deletingId) return;
    const confirmed = window.confirm('Are you sure you want to delete this listing?');
    if (!confirmed) return;

    setDeletingId(String(id));
    // Optimistic removal
    const snapshot = listings;
    setListings((prev) => prev.filter((item) => String(item.id || item._id) !== String(id)));

    try {
      const { data } = await api.delete(`/yarns/${id}`);
      toast.success(data?.message || 'Listing deleted successfully');
      await fetchSellerData();
    } catch (error: any) {
      // Rollback on failure
      setListings(snapshot);
      toast.error(error?.response?.data?.message || 'Unable to delete listing');
    } finally {
      setDeletingId(null);
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
            <img src="/logo.jpeg" alt="WeaveShare" className="h-12 w-auto" />
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-slate-700">Dashboard</span>
            <span className="text-slate-700">My Listings</span>
            <button onClick={handleLogout} className="secondary-btn px-3 py-2 text-sm">
              Logout
            </button>
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
              {listings.length ? (
                listings.map((item) => {
                  const id = item.id || item._id;
                  const firstImage = resolveImageUrl(item.imageUrls?.[0]);
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* ✅ NEW: thumbnail so seller can SEE the uploaded image */}
                        <img
                          src={firstImage}
                          alt={item.name}
                          className="h-14 w-14 flex-none rounded-xl object-cover bg-slate-200"
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (!img.dataset.fallback) {
                              img.dataset.fallback = '1';
                              img.src = '/blue.jpg';
                            }
                          }}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{item.name}</div>
                          <div className="text-sm text-slate-500 truncate">
                            {item.materialType} • {item.color} • {item.weight} {item.weightUnit}
                          </div>
                          {item.imageUrls?.length ? (
                            <div className="text-xs text-emerald-600">
                              {item.imageUrls.length} image{item.imageUrls.length > 1 ? 's' : ''}
                            </div>
                          ) : (
                            <div className="text-xs text-red-500">No image saved</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className="font-bold text-brand-teal">₹{item.finalPrice}</div>
                          <div className="text-xs text-slate-500">{item.status}</div>
                        </div>
                        <button
                          onClick={() => handleDelete(id)}
                          disabled={deletingId === String(id)}
                          className="rounded-full bg-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-200 disabled:opacity-50"
                          title="Delete listing"
                        >
                          {deletingId === String(id) ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-slate-500">No listings yet.</div>
              )}
            </div>
          </div>

          <div className="card-shell p-5">
            <h3 className="mb-4 text-2xl font-black text-brand-dark">LIST YOUR YARN</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                className="soft-input"
                placeholder="Yarn Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className="soft-input"
                  value={form.materialType}
                  onChange={(e) => setForm({ ...form, materialType: e.target.value })}
                >
                  {['COTTON', 'SILK', 'WOOL', 'LINEN', 'POLYESTER', 'MIXED', 'OTHER'].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <input
                  className="soft-input"
                  placeholder="Color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="soft-input"
                  type="number"
                  step="0.1"
                  placeholder="Weight"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  required
                />
                <select
                  className="soft-input"
                  value={form.weightUnit}
                  onChange={(e) => setForm({ ...form, weightUnit: e.target.value })}
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className="soft-input"
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                >
                  {['NEW_LEFTOVER', 'GOOD', 'USED', 'MIXED'].map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
                <input
                  className="soft-input"
                  placeholder="Location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>
              <textarea
                className="soft-input min-h-[100px] rounded-[20px]"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
              <input
                className="soft-input"
                type="number"
                step="0.01"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full rounded-full border border-dashed border-slate-300 bg-slate-50 p-3 text-sm"
              />
              {preview.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {preview.map((image, index) => (
                    <img
                      key={image + index}
                      src={image}
                      alt="Preview"
                      className="h-20 w-full rounded-xl object-cover"
                    />
                  ))}
                </div>
              )}
              <button type="submit" className="primary-btn w-full" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Listing'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}