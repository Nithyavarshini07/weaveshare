import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import api, { resolveImageUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import { timeAgo } from '../lib/timeAgo';

type Seller = { name?: string; email?: string; location?: string };
type Review = {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  buyerId: { name?: string } | string;
};
type Yarn = {
  _id?: string;
  id?: string;
  name: string;
  materialType: string;
  color: string;
  weight: number;
  weightUnit: string;
  condition: string;
  description: string;
  location: string;
  finalPrice: number;
  basePricePerKg: number;
  imageUrls?: string[];
  sellerId?: Seller | string;
  avgRating?: number;
  reviewCount?: number;
};

function sellerDetails(sellerId?: Seller | string) {
  return typeof sellerId === 'object' ? sellerId : undefined;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<Yarn | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewAverage, setReviewAverage] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchReviews = async (yarnId: string) => {
    const { data } = await api.get<{ reviews: Review[]; avg: number; count: number }>(`/reviews/${yarnId}`);
    setReviews(data.reviews);
    setReviewAverage(data.avg);
    setReviewCount(data.count);
  };

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        const { data } = await api.get<Yarn>(`/yarns/${id}`);
        setItem(data);
        setSelectedImage(data.imageUrls?.[0]);
        await fetchReviews(data._id || data.id || id);
        if (user?.role === 'BUYER') {
          const eligibility = await api.get<{ canReview: boolean; reason?: string }>(`/reviews/can-review/${data._id || data.id || id}`);
          setCanReview(eligibility.data.canReview);
          setReviewReason(eligibility.data.reason || '');
        }
      } catch (requestError: unknown) {
        if (axios.isAxiosError(requestError) && requestError.response?.status === 404) {
          setNotFound(true);
        } else {
          setError('Unable to load this yarn listing.');
        }
      } finally {
        setLoading(false);
      }
    };
    void fetchItem();
  }, [id, user?.role]);

  const submitReview = async () => {
    const yarnId = item?._id || item?.id;
    if (!yarnId || reviewRating < 1 || !reviewComment.trim()) return;
    setReviewSubmitting(true);
    try {
      await api.post('/reviews', { yarnId, rating: reviewRating, comment: reviewComment.trim() });
      await fetchReviews(yarnId);
      setCanReview(false);
      setReviewOpen(false);
      setReviewRating(0);
      setReviewComment('');
      toast.success('Review submitted successfully');
    } catch (requestError: unknown) {
      const message = axios.isAxiosError(requestError) ? requestError.response?.data?.message : undefined;
      toast.error(message || 'Could not submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user || user.role !== 'BUYER') {
      toast.error('Please login as a buyer to add this item to cart.');
      navigate('/login');
      return;
    }
    const yarnId = item?._id || item?.id;
    if (!yarnId) return;
    try {
      await api.post('/cart', { yarnId, quantity: 1 });
      toast.success('Item added to cart');
      navigate('/cart');
    } catch (requestError: unknown) {
      const message = axios.isAxiosError(requestError) ? requestError.response?.data?.message : undefined;
      toast.error(message || 'Could not add to cart');
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#dfeef0]">Loading product...</div>;
  if (notFound) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#dfeef0] p-6"><h1 className="text-3xl font-black text-brand-dark">Yarn not found</h1><Link to="/buyer" className="primary-btn">Back to listings</Link></div>;
  if (error || !item) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#dfeef0] p-6"><p className="text-red-600">{error || 'Unable to load this listing.'}</p><Link to="/buyer" className="primary-btn">Back to listings</Link></div>;

  const images = item.imageUrls?.length ? item.imageUrls : [undefined];
  const seller = sellerDetails(item.sellerId);
  const imageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.dataset.fallback !== 'true') {
      event.currentTarget.dataset.fallback = 'true';
      event.currentTarget.src = '/blue.jpg';
    }
  };

  return (
    <div className="min-h-screen bg-[#dfeef0] p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <Link to="/buyer" className="secondary-btn mb-5 gap-2"><ArrowLeft size={16} /> Back to listings</Link>
        <div className="card-shell p-6">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <img src={resolveImageUrl(selectedImage)} data-fallback="false" onError={imageError} alt={item.name} className="h-[420px] w-full rounded-[28px] object-cover" />
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {images.map((image, index) => <button key={`${image || 'fallback'}-${index}`} onClick={() => setSelectedImage(image)} className={`shrink-0 rounded-2xl p-1 ${selectedImage === image ? 'ring-2 ring-brand-teal' : ''}`}><img src={resolveImageUrl(image)} data-fallback="false" onError={imageError} alt={`${item.name} thumbnail ${index + 1}`} className="h-20 w-20 rounded-xl object-cover" /></button>)}
              </div>
            </div>
            <div>
              <span className="badge">{item.materialType}</span>
              <h1 className="mt-4 text-4xl font-black text-brand-dark">{item.name}</h1>
              <div className="mt-6 space-y-2 text-slate-600"><div>Color: {item.color}</div><div>Weight: {item.weight} {item.weightUnit}</div><div>Condition: {item.condition}</div><div>Seller: {seller?.name || 'Unknown seller'}</div><div>Location: {item.location}</div><div>Price: ₹{item.finalPrice}</div><div>Price per kg: ₹{item.basePricePerKg}</div></div>
              <p className="mt-5 text-slate-600">{item.description}</p>
              <div className="mt-6 flex flex-wrap gap-3"><button onClick={handleAddToCart} className="primary-btn gap-2"><ShoppingCart size={16} /> ADD TO CART</button><button onClick={() => navigate('/checkout')} className="secondary-btn">BUY NOW</button></div>

              <section id="reviews" className="mt-10 border-t border-slate-100 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><h2 className="text-2xl font-black text-brand-dark">Reviews</h2><div className="mt-2 flex items-center gap-2"><span className="text-3xl font-black text-brand-dark">{reviewAverage.toFixed(1)}</span><StarRating value={reviewAverage} readonly size="md" /><a href="#review-list" className="text-sm text-slate-500">({reviewCount} reviews)</a></div></div>
                  {user?.role === 'BUYER' && canReview && <button onClick={() => setReviewOpen(true)} className="secondary-btn">Write a review</button>}
                </div>

                {user?.role === 'BUYER' && reviewOpen && <div className="mt-5 rounded-2xl bg-slate-50 p-4"><StarRating value={reviewRating} onChange={setReviewRating} /><textarea maxLength={500} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="Share your experience" className="soft-input mt-3 min-h-[110px] rounded-[20px]" /><div className="mt-1 text-right text-xs text-slate-500">{reviewComment.length}/500</div><div className="mt-3 flex gap-3"><button onClick={() => setReviewOpen(false)} className="secondary-btn">Cancel</button><button onClick={() => void submitReview()} disabled={reviewSubmitting || reviewRating < 1 || !reviewComment.trim()} className="primary-btn">{reviewSubmitting ? 'Submitting...' : 'Submit review'}</button></div></div>}
                {user?.role === 'BUYER' && !canReview && !reviewOpen && reviewReason === 'You have already reviewed this yarn.' && <p className="mt-4 text-sm font-semibold text-emerald-700">You reviewed this</p>}
                {user?.role === 'BUYER' && !canReview && !reviewOpen && reviewReason && reviewReason !== 'You have already reviewed this yarn.' && <p className="mt-4 text-sm text-slate-500">{reviewReason}</p>}

                <div id="review-list" className="mt-6 space-y-4">{reviews.length ? reviews.map((review) => { const buyerName = typeof review.buyerId === 'object' ? review.buyerId.name : 'Buyer'; return <article key={review._id} className="rounded-2xl bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-bold text-brand-dark">{buyerName || 'Buyer'}</p><StarRating value={review.rating} readonly size="sm" /></div><span className="text-xs text-slate-500">{timeAgo(review.createdAt)}</span></div><p className="mt-3 text-sm text-slate-600">{review.comment}</p></article>; }) : <p className="mt-6 text-sm text-slate-500">No reviews yet. Be the first!</p>}</div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
