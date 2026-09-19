import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import api, { resolveImageUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import OrderTimeline from '../components/OrderTimeline';
import { timeAgo } from '../lib/timeAgo';
import StarRating from '../components/StarRating';

type OrderItem = {
  yarnId: string;
  name: string;
  image?: string | null;
  weight?: number | null;
  quantity: number;
  price: number;
};

type Order = {
  id?: string;
  _id?: string;
  orderNumber: string;
  orderStatus?: string;
  status?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  createdAt: string;
  updatedAt?: string;
  paymentMethod: string;
  shippingName?: string;
  city?: string;
  state?: string;
};

type BuyerReview = {
  yarnId: string;
};

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PACKED: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-cyan-100 text-cyan-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

function getOrderStatus(order: Order) {
  return (order.orderStatus || order.status || 'PENDING').toUpperCase();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export default function OrdersPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewedYarnIds, setReviewedYarnIds] = useState<Set<string>>(new Set());
  const [reviewingYarnId, setReviewingYarnId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [thankYouYarnIds, setThankYouYarnIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get<Order[]>('/orders/my');
        setOrders(Array.isArray(data) ? data : []);
        const reviews = await api.get<BuyerReview[]>('/reviews/me');
        setReviewedYarnIds(new Set(reviews.data.map((review) => String(review.yarnId))));
      } catch {
        setError('Unable to load your orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const submitReview = async (yarnId: string) => {
    if (reviewRating < 1 || !reviewComment.trim()) return;
    setReviewSubmitting(true);
    try {
      await api.post('/reviews', { yarnId, rating: reviewRating, comment: reviewComment.trim() });
      setReviewedYarnIds((current) => new Set(current).add(yarnId));
      setThankYouYarnIds((current) => new Set(current).add(yarnId));
      setReviewingYarnId(null);
      setReviewRating(0);
      setReviewComment('');
    } catch {
      setError('Unable to submit this review. Please try again.');
    } finally {
      setReviewSubmitting(false);
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
          <Link to="/buyer" aria-label="WeaveShare home">
            <img src="/logo.jpeg" alt="WeaveShare" className="h-12 w-auto" />
          </Link>
          <div className="hidden items-center gap-5 md:flex">
            <Link to="/buyer" className="text-sm font-medium text-slate-700">Buy Materials</Link>
            <Link to="/cart" className="text-sm font-medium text-slate-700">Cart</Link>
            <Link to="/orders" className="font-bold text-brand-teal">My Orders</Link>
            <button onClick={handleLogout} className="secondary-btn px-3 py-2 text-sm">Logout</button>
          </div>
        </nav>

        <div className="mb-6 flex items-center gap-4">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="secondary-btn px-3 py-3">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-teal">Buyer account</p>
            <h1 className="text-4xl font-black text-brand-dark">My Orders</h1>
          </div>
        </div>

        {loading && <div className="card-shell p-8 text-center text-slate-600">Loading your orders...</div>}

        {!loading && error && (
          <div className="card-shell p-8 text-center text-red-600">{error}</div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="card-shell flex flex-col items-center p-12 text-center">
            <Package size={44} className="mb-4 text-brand-teal" />
            <h2 className="text-2xl font-black text-brand-dark">No orders yet</h2>
            <p className="mt-2 text-slate-600">Your purchases will appear here after checkout.</p>
            <Link to="/buyer" className="primary-btn mt-6">Browse Materials</Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-5">
            {orders.map((order) => {
              const status = getOrderStatus(order);
              const orderKey = order.id || order._id || order.orderNumber;
              return (
                <article key={orderKey} className="card-shell overflow-hidden p-5 md:p-6">
                  <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-mono text-lg font-bold text-brand-dark">{order.orderNumber}</p>
                      <p className="mt-1 text-sm text-slate-500">Placed {formatDate(order.createdAt)}</p>
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyles[status] || 'bg-slate-100 text-slate-700'}`}>
                      {status}
                    </span>
                  </div>

                  <div className="border-b border-slate-100 py-4">
                    <OrderTimeline status={order.orderStatus || order.status || 'PENDING'} />
                    <p className="mt-2 text-right text-xs text-slate-500">Updated {timeAgo(order.updatedAt || order.createdAt)}</p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {order.items.map((item, index) => {
                      const yarnId = String(item.yarnId);
                      const delivered = status === 'DELIVERED';
                      return <div key={`${item.yarnId}-${index}`} className="flex flex-wrap items-center gap-4 py-4">
                        <img
                          src={resolveImageUrl(item.image)}
                          data-fallback="false"
                          onError={(event) => {
                            if (event.currentTarget.dataset.fallback !== 'true') {
                              event.currentTarget.dataset.fallback = 'true';
                              event.currentTarget.src = '/blue.jpg';
                            }
                          }}
                          alt={item.name}
                          className="h-16 w-16 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-bold text-brand-dark">{item.name}</h3>
                          <p className="text-sm text-slate-500">Qty: {item.quantity} · Weight: {item.weight ?? '-'} </p>
                        </div>
                        <div className="ml-auto flex shrink-0 flex-col items-end gap-2"><p className="text-right font-bold text-brand-dark">₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</p>{delivered && (thankYouYarnIds.has(yarnId) ? <span className="text-xs font-semibold text-emerald-700">Thank you for reviewing</span> : reviewedYarnIds.has(yarnId) ? <span className="text-xs font-semibold text-emerald-700">Reviewed ✓</span> : <button onClick={() => setReviewingYarnId(yarnId)} className="text-xs font-semibold text-brand-teal hover:underline">Write a review</button>)}</div>
                        {reviewingYarnId === yarnId && <div className="basis-full rounded-2xl bg-slate-50 p-4"><StarRating value={reviewRating} onChange={setReviewRating} /><textarea maxLength={500} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="Share your experience" className="soft-input mt-3 min-h-[90px] rounded-[20px]" /><div className="mt-1 text-right text-xs text-slate-500">{reviewComment.length}/500</div><div className="mt-3 flex gap-2"><button onClick={() => setReviewingYarnId(null)} className="secondary-btn">Cancel</button><button onClick={() => void submitReview(yarnId)} disabled={reviewSubmitting || reviewRating < 1 || !reviewComment.trim()} className="primary-btn">{reviewSubmitting ? 'Submitting...' : 'Submit review'}</button></div></div>}
                      </div>;
                    })}
                  </div>

                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="text-sm text-slate-600">
                      <p>Payment: <span className="font-semibold text-slate-800">{order.paymentMethod}</span></p>
                      {order.city && <p>{order.shippingName ? `${order.shippingName}, ` : ''}{order.city}{order.state ? `, ${order.state}` : ''}</p>}
                    </div>
                    <p className="text-2xl font-black text-brand-dark">₹{order.total}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
