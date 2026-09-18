import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, ShoppingCart } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const categories = ['Cotton', 'Silk', 'Wool', 'Linen', 'Polyester', 'Mixed'];

export default function BuyerDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchProducts = async () => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (selectedCategory) query.set('material', selectedCategory.toUpperCase());
    const { data } = await api.get(`/yarns?${query.toString()}`);
    setItems(data);
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const visibleItems = useMemo(() => items || [], [items]);

  return (
    <div className="min-h-screen bg-[#dfeef0] p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex items-center justify-between rounded-[28px] bg-white p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="WeaveShare" className="h-12 w-auto" />
          </div>
          <div className="hidden items-center gap-5 md:flex">
            <Link to="/buyer" className="text-sm font-medium text-slate-700">Buy Materials</Link>
            <Link to="/cart" className="text-sm font-medium text-slate-700">Cart</Link>
            <Link to="/orders" className="text-sm font-medium text-slate-700">My Orders</Link>
            <button onClick={handleLogout} className="secondary-btn px-3 py-2 text-sm">Logout</button>
          </div>
        </nav>

        <section className="mb-6">
          <h1 className="text-4xl font-black text-brand-dark">Find Affordable Yarn</h1>
        </section>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-full bg-white px-4 py-3 shadow-soft">
            <Search size={18} className="text-slate-400" />
            <input
              className="w-full border-0 bg-transparent text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search yarn by name, material, color or location"
            />
          </div>
          <button className="secondary-btn gap-2"><SlidersHorizontal size={16} /> Filters</button>
          <Link to="/cart" className="primary-btn gap-2"><ShoppingCart size={16} /> Cart</Link>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedCategory === cat ? 'bg-[#2e8ca6] text-white' : 'bg-white text-slate-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {visibleItems.map((item) => (
            <div key={item.id} className="card-shell overflow-hidden">
              <img src={item.imageUrls?.[0] || '/placeholder.jpg'} alt={item.name} className="h-52 w-full object-cover" />
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="badge">{item.materialType}</span>
                  <span className="text-sm font-bold text-slate-600">{item.color}</span>
                </div>
                <h3 className="text-lg font-black text-brand-dark">{item.name}</h3>
                <div className="mt-3 text-sm text-slate-600">
                  <div>Weight: {item.weight} {item.weightUnit}</div>
                  <div>Price: ₹{item.finalPrice}</div>
                  <div>Location: {item.location}</div>
                  <div>Seller: {item.seller?.name}</div>
                </div>
                <Link to={`/products/${item.id}`} className="primary-btn mt-4 w-full">VIEW DETAILS</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
