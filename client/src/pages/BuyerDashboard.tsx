import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, ShoppingCart, X } from 'lucide-react';
import api, { resolveImageUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type MaterialType = 'COTTON' | 'SILK' | 'WOOL' | 'LINEN' | 'POLYESTER' | 'MIXED';
type YarnCondition = 'NEW_LEFTOVER' | 'GOOD' | 'USED' | 'MIXED';

type Seller = {
  name?: string;
  email?: string;
  location?: string;
};

type Yarn = {
  _id?: string;
  id?: string;
  name: string;
  materialType: MaterialType | string;
  color: string;
  weight: number;
  weightUnit: 'g' | 'kg' | string;
  finalPrice: number;
  location: string;
  imageUrls?: string[];
  sellerId?: Seller | string;
};

type Filters = {
  minPrice: string;
  maxPrice: string;
  minWeight: string;
  maxWeight: string;
  condition: '' | YarnCondition;
  location: string;
};

const categories: Array<{ label: string; value: MaterialType }> = [
  { label: 'Cotton', value: 'COTTON' },
  { label: 'Silk', value: 'SILK' },
  { label: 'Wool', value: 'WOOL' },
  { label: 'Linen', value: 'LINEN' },
  { label: 'Polyester', value: 'POLYESTER' },
  { label: 'Mixed', value: 'MIXED' },
];

const emptyFilters: Filters = {
  minPrice: '',
  maxPrice: '',
  minWeight: '',
  maxWeight: '',
  condition: '',
  location: '',
};

function sellerName(sellerId?: Seller | string) {
  return typeof sellerId === 'object' ? sellerId.name || 'Unknown seller' : 'Unknown seller';
}

export default function BuyerDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Yarn[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MaterialType | ''>('');
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [draftFilters, setDraftFilters] = useState<Filters>(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const fetchProducts = useCallback(async (signal: AbortSignal) => {
    const query = new URLSearchParams();
    if (debouncedSearch) query.set('search', debouncedSearch);
    if (selectedCategory) query.set('material', selectedCategory);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });

    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<Yarn[]>(`/yarns?${query.toString()}`, { signal });
      setItems(Array.isArray(data) ? data : []);
    } catch (requestError: unknown) {
      if (requestError instanceof Error && requestError.name === 'CanceledError') return;
      if (signal.aborted) return;
      setError('We could not load the yarn listings. Please try again.');
      setItems([]);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [debouncedSearch, filters, selectedCategory]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchProducts(controller.signal);
    return () => controller.abort();
  }, [fetchProducts]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length + (selectedCategory ? 1 : 0),
    [filters, selectedCategory]
  );

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setFilters(emptyFilters);
    setDraftFilters(emptyFilters);
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setIsFilterOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#dfeef0] p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex items-center justify-between rounded-[28px] bg-white p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="WeaveShare" className="h-12 w-auto" />
          </div>
          <div className="hidden items-center gap-5 md:flex">
            <Link to="/buyer" className="font-bold text-brand-teal">Buy Materials</Link>
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
          <button onClick={() => { setDraftFilters(filters); setIsFilterOpen(true); }} className="secondary-btn gap-2">
            <SlidersHorizontal size={16} /> Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
          </button>
          <Link to="/cart" className="primary-btn gap-2"><ShoppingCart size={16} /> Cart</Link>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(selectedCategory === cat.value ? '' : cat.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedCategory === cat.value ? 'bg-[#2e8ca6] text-white' : 'bg-white text-slate-700'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="mb-5 flex items-center justify-between">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-dark">{loading ? '...' : `${items.length} listings found`}</span>
        </div>

        {loading && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="card-shell overflow-hidden animate-pulse">
                <div className="h-[208px] bg-slate-200" />
                <div className="space-y-3 p-4"><div className="h-4 w-1/3 rounded bg-slate-200" /><div className="h-6 rounded bg-slate-200" /><div className="h-16 rounded bg-slate-200" /></div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="card-shell p-10 text-center"><p className="text-red-600">{error}</p><button onClick={() => { const controller = new AbortController(); void fetchProducts(controller.signal); }} className="primary-btn mt-5">Retry</button></div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="card-shell p-12 text-center"><h2 className="text-2xl font-black text-brand-dark">No yarn matches your filters</h2><button onClick={clearFilters} className="primary-btn mt-5">Clear filters</button></div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => {
              const itemId = item._id || item.id;
              return (
                <div key={itemId || item.name} className="card-shell overflow-hidden">
                  <img src={resolveImageUrl(item.imageUrls?.[0])} data-fallback="false" onError={(event) => { if (event.currentTarget.dataset.fallback !== 'true') { event.currentTarget.dataset.fallback = 'true'; event.currentTarget.src = '/blue.jpg'; } }} alt={item.name} className="h-[208px] w-full object-cover" />
                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between gap-3"><span className="badge">{item.materialType}</span><span className="truncate text-sm font-bold text-slate-600">{item.color}</span></div>
                    <h3 className="truncate text-lg font-black text-brand-dark" title={item.name}>{item.name}</h3>
                    <div className="mt-3 space-y-1 text-sm text-slate-600"><div>Weight: {item.weight} {item.weightUnit}</div><div>Price: ₹{item.finalPrice}</div><div>Location: {item.location}</div><div>Seller: {sellerName(item.sellerId)}</div></div>
                    <Link to={`/products/${itemId}`} className="primary-btn mt-4 w-full">VIEW DETAILS</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isFilterOpen && <div className="fixed inset-0 z-40 bg-slate-900/30" onClick={() => setIsFilterOpen(false)} />}
      <aside className={`fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl transition-transform ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`} aria-hidden={!isFilterOpen}>
        <div className="flex items-center justify-between"><h2 className="text-2xl font-black text-brand-dark">Filters</h2><button onClick={() => setIsFilterOpen(false)} aria-label="Close filters" className="secondary-btn p-3"><X size={18} /></button></div>
        <div className="mt-8 space-y-5">
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Price range</label><div className="grid grid-cols-2 gap-3"><input type="number" min="0" placeholder="Min price" value={draftFilters.minPrice} onChange={(event) => setDraftFilters({ ...draftFilters, minPrice: event.target.value })} className="soft-input" /><input type="number" min="0" placeholder="Max price" value={draftFilters.maxPrice} onChange={(event) => setDraftFilters({ ...draftFilters, maxPrice: event.target.value })} className="soft-input" /></div></div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Weight range (kg)</label><div className="grid grid-cols-2 gap-3"><input type="number" min="0" step="0.01" placeholder="Min weight" value={draftFilters.minWeight} onChange={(event) => setDraftFilters({ ...draftFilters, minWeight: event.target.value })} className="soft-input" /><input type="number" min="0" step="0.01" placeholder="Max weight" value={draftFilters.maxWeight} onChange={(event) => setDraftFilters({ ...draftFilters, maxWeight: event.target.value })} className="soft-input" /></div></div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Condition</label><select value={draftFilters.condition} onChange={(event) => setDraftFilters({ ...draftFilters, condition: event.target.value as Filters['condition'] })} className="soft-input"><option value="">All conditions</option><option value="NEW_LEFTOVER">New leftover</option><option value="GOOD">Good</option><option value="USED">Used</option><option value="MIXED">Mixed</option></select></div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Location</label><input value={draftFilters.location} onChange={(event) => setDraftFilters({ ...draftFilters, location: event.target.value })} placeholder="Search by location" className="soft-input" /></div>
        </div>
        <div className="mt-8 flex gap-3"><button onClick={() => { setDraftFilters(emptyFilters); setFilters(emptyFilters); }} className="secondary-btn flex-1">Reset</button><button onClick={applyFilters} className="primary-btn flex-1">Apply</button></div>
      </aside>
    </div>
  );
}
