import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    const fetchItem = async () => {
      const { data } = await api.get(`/yarns/${id}`);
      setItem(data);
    };
    if (id) fetchItem();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user || user.role !== 'BUYER') {
      toast.error('Please login as a buyer to add this item to cart.');
      navigate('/login');
      return;
    }

    try {
      await api.post('/cart', { yarnId: item.id, quantity: 1 });
      toast.success('Item added to cart');
      navigate('/cart');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not add to cart');
    }
  };

  if (!item) return <div className="flex min-h-screen items-center justify-center">Loading product...</div>;

  return (
    <div className="min-h-screen bg-[#dfeef0] p-4 md:p-6">
      <div className="mx-auto max-w-6xl card-shell p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <img src={item.imageUrls?.[0] || '/placeholder.jpg'} alt={item.name} className="h-[420px] w-full rounded-[28px] object-cover" />
          </div>

          <div>
            <span className="badge">{item.materialType}</span>
            <h1 className="mt-4 text-4xl font-black text-brand-dark">{item.name}</h1>
            <div className="mt-6 space-y-2 text-slate-600">
              <div>Color: {item.color}</div>
              <div>Weight: {item.weight} {item.weightUnit}</div>
              <div>Condition: {item.condition}</div>
              <div>Seller: {item.seller?.name}</div>
              <div>Location: {item.location}</div>
              <div>Price: ₹{item.finalPrice}</div>
              <div>Price per kg: ₹{item.basePricePerKg}</div>
            </div>
            <p className="mt-5 text-slate-600">{item.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={handleAddToCart} className="primary-btn">ADD TO CART</button>
              <button onClick={() => navigate('/checkout')} className="secondary-btn">BUY NOW</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
