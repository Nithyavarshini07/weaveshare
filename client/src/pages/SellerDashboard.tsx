import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import api, { resolveImageUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import OrderTimeline from '../components/OrderTimeline';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ChatList from '../components/ChatList';
import ChatThread from '../components/ChatThread';
import EcoImpactPanel from '../components/EcoImpactPanel';
import { computePlatformEcoStats } from '../lib/mockEco';
import {
  getConversationsForUser,
  getMessagesForConversation,
  type ChatConversation,
  type ChatMessage,
} from '../lib/mockChat';

type Tab = 'overview' | 'listings' | 'chats' | 'orders';
type Listing = { _id?: string; id?: string; name: string; materialType: string; color: string; weight: number; weightUnit: string; condition: string; description: string; location: string; finalPrice: number; imageUrls?: string[]; status: string; avgRating?: number; reviewCount?: number };
type OrderItem = { yarnId: string; name: string; image?: string; quantity: number; price: number; weight?: number; weightUnit?: string };
type SellerOrder = { _id?: string; id?: string; orderNumber: string; orderStatus?: string; status?: string; createdAt: string; items: OrderItem[]; total: number; shippingName?: string; city?: string; state?: string; pincode?: string };
type ListingForm = { name: string; materialType: string; color: string; weight: string; weightUnit: string; condition: string; description: string; location: string; finalPrice: string };
type ChartPoint = { date: string; revenue: number; orders: number };
type TopListing = { id: string; name: string; image?: string; units: number; revenue: number; avgRating: number; reviewCount: number };

const blankForm: ListingForm = { name: '', materialType: 'COTTON', color: '', weight: '', weightUnit: 'kg', condition: 'GOOD', description: '', location: '', finalPrice: '' };
const nextStatus: Record<string, string> = { PENDING: 'CONFIRMED', CONFIRMED: 'PACKED', PACKED: 'SHIPPED', SHIPPED: 'DELIVERED' };
const statusStyle: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-800', CONFIRMED: 'bg-blue-100 text-blue-800', PACKED: 'bg-purple-100 text-purple-800', SHIPPED: 'bg-cyan-100 text-cyan-800', DELIVERED: 'bg-emerald-100 text-emerald-800', CANCELLED: 'bg-red-100 text-red-800' };

function idOf(value: { _id?: string; id?: string }) { return value._id || value.id || ''; }
function statusOf(order: SellerOrder) { return (order.orderStatus || order.status || 'PENDING').toUpperCase(); }

function apiError(error: unknown, t: (key: string) => string) {
  if (typeof error === 'object' && error !== null) {
    const anyErr = error as any;
    const status = anyErr?.response?.status;
    const serverMessage = anyErr?.response?.data?.message;
    if (serverMessage) {
      console.error(`API error [${status}]:`, serverMessage, anyErr?.response?.data);
      return String(serverMessage);
    }
    if (anyErr?.message) {
      console.error('API error:', anyErr.message);
      return String(anyErr.message);
    }
  }
  console.error('Unknown API error:', error);
  return t('errors.requestFailed');
}

function fallback(event: React.SyntheticEvent<HTMLImageElement>) { if (event.currentTarget.dataset.fallback !== 'true') { event.currentTarget.dataset.fallback = 'true'; event.currentTarget.src = '/blue.jpg'; } }

export default function SellerDashboard() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const activeTab = (params.get('tab') as Tab) || 'overview';
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>(() =>
    user?.id ? getConversationsForUser(user.id, 'SELLER') : []
  );
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(() => {
    const initial: Record<string, ChatMessage[]> = {};
    if (user?.id) {
      getConversationsForUser(user.id, 'SELLER').forEach((conversation) => {
        initial[conversation.id] = getMessagesForConversation(conversation.id).map((message) => ({
          ...message,
          senderId: message.senderId === conversation.seller.id ? user.id : message.senderId,
        }));
      });
    }
    return initial;
  });
  const activeChatId = params.get('chatId') ?? undefined;
  const activeChatConversation = chatConversations.find((conversation) => conversation.id === activeChatId) ?? null;
  const activeChatMessages = activeChatConversation
    ? chatMessages[activeChatConversation.id] ?? []
    : [];
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [form, setForm] = useState<ListingForm>(blankForm);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [editForm, setEditForm] = useState<ListingForm>(blankForm);
  const [editImages, setEditImages] = useState<File[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [busyOrders, setBusyOrders] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState('');

  const fetchData = useCallback(async () => {
    const [listingResponse, orderResponse] = await Promise.all([api.get<Listing[]>('/yarns/my'), api.get<SellerOrder[]>('/orders/my')]);
    setListings(listingResponse.data);
    setOrders(orderResponse.data);
  }, []);

  useEffect(() => { if (user?.role === 'SELLER') void fetchData(); }, [fetchData, user]);

  const delivered = useMemo(() => orders.filter((order) => statusOf(order) === 'DELIVERED'), [orders]);
  const stats = useMemo(() => ({ listings: listings.length, available: listings.filter((listing) => listing.status === 'AVAILABLE').length, orders: orders.length, earnings: delivered.reduce((sum, order) => sum + order.total, 0) }), [delivered, listings, orders]);
  const chartData = useMemo<ChartPoint[]>(() => {
    const points = new Map<string, ChartPoint>();
    for (let offset = 29; offset >= 0; offset -= 1) { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - offset); points.set(date.toISOString().slice(0, 10), { date: date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }), revenue: 0, orders: 0 }); }
    delivered.forEach((order) => { const point = points.get(new Date(order.createdAt).toISOString().slice(0, 10)); if (point) { point.revenue += order.total; point.orders += 1; } });
    return [...points.values()];
  }, [delivered, i18n.language]);
  const topListings = useMemo<TopListing[]>(() => { const map = new Map<string, TopListing>(); delivered.forEach((order) => order.items.forEach((item) => { const id = String(item.yarnId); const listing = listings.find((candidate) => idOf(candidate) === id); const current = map.get(id) || { id, name: item.name, image: listing?.imageUrls?.[0], units: 0, revenue: 0, avgRating: listing?.avgRating || 0, reviewCount: listing?.reviewCount || 0 }; current.units += item.quantity; current.revenue += item.price * item.quantity; map.set(id, current); })); return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5); }, [delivered, listings]);
  const revenue = chartData.reduce((sum, point) => sum + point.revenue, 0);
  const orderCount = chartData.reduce((sum, point) => sum + point.orders, 0);

  // 🆕 Eco impact — computed from this seller's delivered orders
  const ecoStats = useMemo(
    () => computePlatformEcoStats(listings, delivered),
    [listings, delivered]
  );
  const monthlyImpact = useMemo(() => {
    const buckets: Record<string, { month: string; yarnReusedKg: number; co2SavedKg: number }> = {};
    const now = new Date();
    const order: string[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(i18n.language, { month: 'short' });
      buckets[key] = { month: label, yarnReusedKg: 0, co2SavedKg: 0 };
      order.push(key);
    }
    delivered.forEach((o: any) => {
      const created = new Date(o.createdAt || o.updatedAt || Date.now());
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      if (!buckets[key]) return;
      let orderKg = 0;
      (o.items || []).forEach((item: any) => {
        const yarnId = String(item.yarnId || '');
        const listing = listings.find((l) => idOf(l) === yarnId);
        const rawWeight = Number(item.weight ?? listing?.weight ?? 0);
        const unit = String(item.weightUnit ?? listing?.weightUnit ?? 'kg').toLowerCase();
        const weightKg = unit === 'g' ? rawWeight / 1000 : rawWeight;
        orderKg += weightKg * Number(item.quantity || 1);
      });
      buckets[key].yarnReusedKg += orderKg;
      buckets[key].co2SavedKg += orderKg * 2.5;
    });
    return order.map((key) => ({
      month: buckets[key].month,
      yarnReusedKg: Number(buckets[key].yarnReusedKg.toFixed(1)),
      co2SavedKg: Number(buckets[key].co2SavedKg.toFixed(1)),
    }));
  }, [delivered, listings, i18n.language]);

  const setTab = (tab: Tab) => setParams({ tab });
  const handleChatSelect = (id: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', 'chats');
      next.set('chatId', id);
      return next;
    });
  };
  const handleChatSend = (text: string) => {
    if (!activeChatConversation || !user) return;
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      conversationId: activeChatConversation.id,
      senderId: user.id,
      text,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setChatMessages((current) => ({
      ...current,
      [activeChatConversation.id]: [...(current[activeChatConversation.id] ?? []), newMessage],
    }));
    setChatConversations((current) => current.map((conversation) => conversation.id === activeChatConversation.id
      ? { ...conversation, lastMessage: text, lastMessageAt: newMessage.createdAt }
      : conversation));
  };
  const chatUnreadTotal = chatConversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
  const logoutSeller = async () => { await logout(); navigate('/login'); };

  const createListing = async (event: FormEvent) => { event.preventDefault(); if (submitting) return; setSubmitting(true); try { const payload = new FormData(); Object.entries(form).forEach(([key, value]) => payload.append(key, value)); images.forEach((image) => payload.append('images', image)); await api.post('/yarns', payload); toast.success(t('seller.listingCreated')); setForm(blankForm); setImages([]); setPreviews([]); await fetchData(); } catch (error: unknown) { toast.error(apiError(error, t)); } finally { setSubmitting(false); } };

  const openEdit = (listing: Listing) => { setEditing(listing); setEditForm({ name: listing.name, materialType: listing.materialType, color: listing.color, weight: String(listing.weight), weightUnit: listing.weightUnit, condition: listing.condition, description: listing.description, location: listing.location, finalPrice: String(listing.finalPrice) }); setRemovedImages([]); setEditImages([]); };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing || submitting) return;
    const id = idOf(editing);
    if (!id) { toast.error(t('errors.requestFailed')); return; }

    const weight = Number(editForm.weight);
    const finalPrice = Number(editForm.finalPrice);
    if (!Number.isFinite(weight) || weight <= 0) { toast.error(t('errors.weightPositive')); return; }
    if (!Number.isFinite(finalPrice) || finalPrice <= 0) { toast.error(t('errors.pricePositive')); return; }
    if (!editForm.name.trim()) { toast.error(t('errors.nameRequired')); return; }
    if (!editForm.color.trim()) { toast.error(t('errors.colorRequired')); return; }
    if (!editForm.description.trim()) { toast.error(t('errors.descriptionRequired')); return; }
    if (!editForm.location.trim()) { toast.error(t('errors.locationRequired')); return; }

    const keepImages = (editing.imageUrls || []).filter((image) => !removedImages.includes(image));

    setSubmitting(true);
    try {
      await api.put(`/yarns/${id}`, {
        name: editForm.name.trim(),
        materialType: editForm.materialType,
        color: editForm.color.trim(),
        weight,
        weightUnit: editForm.weightUnit,
        condition: editForm.condition,
        description: editForm.description.trim(),
        location: editForm.location.trim(),
        finalPrice,
        imageUrls: keepImages,
      });

      if (editImages.length) {
        const payload = new FormData();
        editImages.forEach((image) => payload.append('images', image));
        await api.post(`/yarns/${id}/images`, payload);
      }

      toast.success(t('seller.listingUpdated'));
      setEditing(null);
      setEditImages([]);
      setRemovedImages([]);
      await fetchData();
    } catch (error: unknown) {
      toast.error(apiError(error, t));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteListing = async (id: string) => { if (!window.confirm(t('seller.deleteConfirm'))) return; setDeletingId(id); try { await api.delete(`/yarns/${id}`); toast.success(t('seller.listingDeleted')); await fetchData(); } catch (error: unknown) { toast.error(apiError(error, t)); } finally { setDeletingId(''); } };

  const updateOrder = async (order: SellerOrder, status: string) => { const id = idOf(order); const snapshot = orders; setBusyOrders((current) => new Set(current).add(id)); setOrders((current) => current.map((candidate) => idOf(candidate) === id ? { ...candidate, orderStatus: status } : candidate)); try { await api.put(`/orders/${id}/status`, { status }); toast.success(`${t('order.status')}: ${t(`status.${status}`)}`); await fetchData(); } catch (error: unknown) { setOrders(snapshot); toast.error(apiError(error, t)); } finally { setBusyOrders((current) => { const next = new Set(current); next.delete(id); return next; }); } };

  const renderFields = (values: ListingForm, update: (value: ListingForm) => void) => <>
    <input className="soft-input" placeholder={t('listing.yarnName')} value={values.name} onChange={(event) => update({ ...values, name: event.target.value })} required />
    <div className="grid gap-3 md:grid-cols-2"><select className="soft-input" value={values.materialType} onChange={(event) => update({ ...values, materialType: event.target.value })}>{['COTTON', 'SILK', 'WOOL', 'LINEN', 'POLYESTER', 'MIXED', 'OTHER'].map((type) => <option key={type} value={type}>{t(`material.${type}`)}</option>)}</select><input className="soft-input" placeholder={t('listing.color')} value={values.color} onChange={(event) => update({ ...values, color: event.target.value })} required /></div>
    <div className="grid gap-3 md:grid-cols-2"><input className="soft-input" type="number" step="0.1" placeholder={t('listing.weight')} value={values.weight} onChange={(event) => update({ ...values, weight: event.target.value })} required /><select className="soft-input" value={values.weightUnit} onChange={(event) => update({ ...values, weightUnit: event.target.value })}><option>kg</option><option>g</option></select></div>
    <div className="grid gap-3 md:grid-cols-2"><select className="soft-input" value={values.condition} onChange={(event) => update({ ...values, condition: event.target.value })}>{['NEW_LEFTOVER', 'GOOD', 'USED', 'MIXED'].map((condition) => <option key={condition} value={condition}>{t(`condition.${condition}`)}</option>)}</select><input className="soft-input" placeholder={t('listing.location')} value={values.location} onChange={(event) => update({ ...values, location: event.target.value })} required /></div>
    <textarea className="soft-input min-h-[100px] rounded-[20px]" placeholder={t('listing.description')} value={values.description} onChange={(event) => update({ ...values, description: event.target.value })} required />
    <input className="soft-input" type="number" step="0.01" placeholder={t('listing.finalPrice')} value={values.finalPrice} onChange={(event) => update({ ...values, finalPrice: event.target.value })} required />
  </>;

  return (
    <div className="min-h-screen bg-[#dfeef0] p-4 md:p-6"><div className="mx-auto max-w-7xl">
      <nav className="mb-6 flex items-center justify-between rounded-[28px] bg-white p-4 shadow-soft"><img src="/logo.jpeg" alt="WeaveShare" className="h-12 w-auto" /><div className="flex items-center gap-3"><LanguageSwitcher /><button onClick={() => void logoutSeller()} className="secondary-btn px-3 py-2 text-sm">{t('common.logout')}</button></div></nav>
      <div className="mb-6 flex flex-wrap gap-2">{(['overview', 'listings', 'chats', 'orders'] as Tab[]).map((tab) => <button key={tab} onClick={() => setTab(tab)} className={`rounded-full px-5 py-3 text-sm font-bold capitalize ${activeTab === tab ? 'bg-brand-teal text-white' : 'bg-white text-slate-700'}`}>{tab === 'orders' ? t('nav.incomingOrders') : tab === 'chats' ? t('nav.chats') : t(`nav.${tab}`)}{tab === 'chats' && chatUnreadTotal > 0 && <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{chatUnreadTotal}</span>}</button>)}</div>
      {activeTab === 'overview' && <>
        <div className="grid gap-4 md:grid-cols-4">{[[t('seller.totalListings'), stats.listings], [t('seller.availableYarn'), stats.available], [t('seller.ordersReceived'), stats.orders], [t('seller.totalEarnings'), `₹${stats.earnings}`]].map(([label, value]) => <div key={String(label)} className="card-shell p-5"><div className="text-sm text-slate-500">{label}</div><div className="mt-3 text-3xl font-black text-brand-dark">{value}</div></div>)}</div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="card-shell p-5"><h2 className="text-2xl font-black text-brand-dark">{t('seller.revenueLast30')}</h2><p className="mb-4 text-sm text-slate-500">{t('order.total')} ₹{revenue} · {orderCount} {t('nav.orders')} · Avg ₹{orderCount ? (revenue / orderCount).toFixed(0) : '0'}</p>{orderCount ? <ResponsiveContainer width="100%" height={280}><LineChart data={chartData}><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis /><Tooltip formatter={(value: unknown) => `₹${value ?? 0}`} /><Line type="monotone" dataKey="revenue" stroke="#2e8ca6" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer> : <div className="flex h-[280px] items-center justify-center text-slate-500">{t('seller.noDeliveredOrders')}</div>}</section>
          <section className="card-shell overflow-hidden p-5"><h2 className="mb-4 text-2xl font-black text-brand-dark">{t('seller.topListings')}</h2>{topListings.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-500"><tr><th className="pb-3">{t('listing.yarnName')}</th><th className="pb-3">{t('listing.unitsSold')}</th><th className="pb-3">{t('listing.revenue')}</th><th className="pb-3">{t('listing.avgRating')}</th></tr></thead><tbody>{topListings.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="py-3"><div className="flex items-center gap-2"><img src={resolveImageUrl(item.image)} onError={fallback} alt="" className="h-10 w-10 rounded-lg object-cover" />{item.name}</div></td><td>{item.units}</td><td>₹{item.revenue}</td><td>{item.reviewCount ? `${item.avgRating.toFixed(1)} (${item.reviewCount})` : t('listing.noReviewsYet')}</td></tr>)}</tbody></table></div> : <p className="py-12 text-center text-slate-500">{t('seller.noSalesYet')}</p>}</section>
        </div>
        <div className="mt-6">
          <EcoImpactPanel stats={ecoStats} monthly={monthlyImpact} variant="seller" />
        </div>
      </>}
      {activeTab === 'listings' && <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"><section className="card-shell p-5"><h2 className="mb-4 text-2xl font-black text-brand-dark">{t('seller.myListings')}</h2><div className="space-y-3">{listings.map((listing) => { const id = idOf(listing); return <div key={id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3"><div className="flex min-w-0 items-center gap-3"><img src={resolveImageUrl(listing.imageUrls?.[0])} onError={fallback} alt={listing.name} className="h-14 w-14 rounded-xl object-cover" /><div className="min-w-0"><div className="truncate font-bold text-slate-800">{listing.name}</div>{listing.reviewCount ? <div className="flex items-center gap-2"><StarRating value={listing.avgRating || 0} readonly size="sm" /><span className="text-xs text-slate-500">{listing.avgRating?.toFixed(1)} ({listing.reviewCount})</span></div> : <div className="text-xs text-slate-500">{t('listing.noReviewsYet')}</div>}<div className="text-sm text-slate-500">{t(`material.${listing.materialType}`)} · {listing.weight} {listing.weightUnit}</div></div></div><div className="flex items-center gap-2"><span className="font-bold text-brand-teal">₹{listing.finalPrice}</span><button onClick={() => openEdit(listing)} className="secondary-btn px-3 py-2 text-xs">{t('common.edit')}</button><button onClick={() => void deleteListing(id)} disabled={deletingId === id} className="rounded-full bg-red-100 px-3 py-2 text-xs text-red-600">{t('common.delete')}</button></div></div>; })}</div></section><section className="card-shell p-5"><h2 className="mb-4 text-2xl font-black text-brand-dark">{t('seller.listYourYarn')}</h2><form onSubmit={(event) => void createListing(event)} className="space-y-3">{renderFields(form, setForm)}<input type="file" multiple accept="image/*" onChange={(event) => { const files = Array.from(event.target.files || []); setImages(files); setPreviews(files.map((file) => URL.createObjectURL(file))); }} className="block w-full rounded-full border border-dashed border-slate-300 bg-slate-50 p-3 text-sm" />{previews.length > 0 && <div className="grid grid-cols-3 gap-2">{previews.map((image) => <img key={image} src={image} alt="Preview" className="h-20 w-full rounded-xl object-cover" />)}</div>}<button type="submit" disabled={submitting} className="primary-btn w-full">{submitting ? t('common.creating') : t('seller.createListing')}</button></form></section></div>}
      {activeTab === 'chats' && <div className="card-shell h-[calc(100vh-260px)] overflow-hidden"><div className="hidden h-full md:grid md:grid-cols-[340px_1fr]"><div className="border-r border-slate-100"><ChatList conversations={chatConversations} activeId={activeChatId} onSelect={handleChatSelect} currentUserId={user!.id} /></div><div className="min-w-0"><ChatThread conversation={activeChatConversation} currentUserId={user!.id} messages={activeChatMessages} onSend={handleChatSend} /></div></div><div className="h-full md:hidden">{activeChatConversation ? <div className="relative h-full"><button type="button" onClick={() => { setParams((current) => { const next = new URLSearchParams(current); next.set('tab', 'chats'); next.delete('chatId'); return next; }); }} className="absolute left-2 top-2 z-10 rounded-full bg-white p-2 text-brand-dark shadow-soft" aria-label={t('chat.backToList')}>←</button><ChatThread conversation={activeChatConversation} currentUserId={user!.id} messages={activeChatMessages} onSend={handleChatSend} /></div> : <ChatList conversations={chatConversations} activeId={activeChatId} onSelect={handleChatSelect} currentUserId={user!.id} />}</div></div>}
      {activeTab === 'orders' && <div className="space-y-6">{(['Active', 'Completed', 'Cancelled'] as const).map((group) => { const groupOrders = orders.filter((order) => group === 'Active' ? ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED'].includes(statusOf(order)) : statusOf(order) === group.toUpperCase()); return <section key={group}><h2 className="mb-3 text-2xl font-black text-brand-dark">{t(`order.${group.toLowerCase()}`)}</h2><div className="grid gap-5 lg:grid-cols-2">{groupOrders.map((order) => { const status = statusOf(order); const id = idOf(order); const busy = busyOrders.has(id); return <article key={id} className="card-shell p-5"><div className="flex items-start justify-between"><div><h3 className="font-mono font-bold text-brand-dark">{order.orderNumber}</h3><p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString(i18n.language)} · {order.shippingName || t('auth.buyer')}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[status]}`}>{t(`status.${status}`)}</span></div><OrderTimeline status={status} compact />{order.items.map((item) => <div key={item.yarnId} className="flex items-center gap-3 border-t border-slate-100 py-3"><img src={resolveImageUrl(item.image)} onError={fallback} alt={item.name} className="h-12 w-12 rounded-lg object-cover" /><div className="text-sm"><div className="font-semibold text-brand-dark">{item.name}</div><div className="text-slate-500">{t('listing.quantity')} {item.quantity} · ₹{item.price}</div></div></div>)}<p className="mt-3 text-sm text-slate-600">{t('order.shipTo')}: {order.city || '-'}, {order.state || '-'} {order.pincode || ''}</p><div className="mt-4 flex items-center justify-between"><strong className="text-xl text-brand-dark">₹{order.total}</strong><div className="flex gap-2">{nextStatus[status] && <button disabled={busy} onClick={() => void updateOrder(order, nextStatus[status])} className="primary-btn px-3 py-2 text-xs">{busy ? t('common.saving') : `${t('common.next')}: ${t(`status.${nextStatus[status]}`)}`}</button>}{['PENDING', 'CONFIRMED'].includes(status) && <button disabled={busy} onClick={() => void updateOrder(order, 'CANCELLED')} className="secondary-btn px-3 py-2 text-xs">{t('order.cancelOrder')}</button>}</div></div></article>; })}</div>{!groupOrders.length && <div className="card-shell p-6 text-slate-500">{t(group === 'Active' ? 'order.noActiveOrders' : group === 'Completed' ? 'order.noCompletedOrders' : 'order.noCancelledOrders')}</div>}</section>; })}</div>}
      {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><form onSubmit={(event) => void saveEdit(event)} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6"><div className="mb-5 flex justify-between"><h2 className="text-2xl font-black text-brand-dark">{t('seller.editListing')}</h2><button type="button" onClick={() => setEditing(null)} className="secondary-btn">{t('common.close')}</button></div><div className="space-y-3">{renderFields(editForm, setEditForm)}<p className="text-sm font-semibold text-slate-700">{t('listing.currentImages')}</p><div className="flex flex-wrap gap-2">{(editing.imageUrls || []).filter((image) => !removedImages.includes(image)).map((image) => <div key={image} className="relative"><img src={resolveImageUrl(image)} onError={fallback} alt="Current listing" className="h-20 w-20 rounded-xl object-cover" /><button type="button" onClick={() => setRemovedImages((current) => [...current, image])} className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-1 text-xs text-white">X</button></div>)}</div><input type="file" multiple accept="image/*" onChange={(event) => setEditImages(Array.from(event.target.files || []))} className="block w-full rounded-full border border-dashed border-slate-300 bg-slate-50 p-3 text-sm" /><div className="flex gap-3"><button type="button" onClick={() => setEditing(null)} className="secondary-btn flex-1">{t('common.cancel')}</button><button type="submit" disabled={submitting} className="primary-btn flex-1">{submitting ? t('common.saving') : t('seller.saveChanges')}</button></div></div></form></div>}
    </div></div>
  );
}