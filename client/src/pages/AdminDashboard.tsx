import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api.get('/admin/users'), api.get('/admin/listings'), api.get('/admin/orders')]).then(([userResponse, listingResponse, orderResponse]) => {
      setUsers(userResponse.data);
      setListings(listingResponse.data);
      setOrders(orderResponse.data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#dfeef0] p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 card-shell p-5">
          <h1 className="text-3xl font-black text-brand-dark">Admin Dashboard</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            ['Total users', users.length],
            ['Total sellers', users.filter((u) => u.role === 'SELLER').length],
            ['Total buyers', users.filter((u) => u.role === 'BUYER').length],
            ['Total listings', listings.length],
            ['Total orders', orders.length],
            ['Total sales', `₹${orders.filter((o) => (o.orderStatus || o.status) === 'DELIVERED').reduce((sum, o) => sum + Number(o.total || o.totalAmount || 0), 0)}`],
          ].map(([label, value]) => (
            <div key={String(label)} className="card-shell p-4">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-black text-brand-dark">{String(value)}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="card-shell p-5">
            <h3 className="mb-3 text-xl font-black text-brand-dark">Users</h3>
            <div className="space-y-2">{users.map((u) => <div key={u.id} className="rounded-xl bg-slate-50 p-3">{u.name} • {u.role}</div>)}</div>
          </div>
          <div className="card-shell p-5">
            <h3 className="mb-3 text-xl font-black text-brand-dark">Listings</h3>
            <div className="space-y-2">{listings.map((l) => <div key={l.id} className="rounded-xl bg-slate-50 p-3">{l.name}</div>)}</div>
          </div>
          <div className="card-shell p-5">
            <h3 className="mb-3 text-xl font-black text-brand-dark">Orders</h3>
            <div className="space-y-2">{orders.map((o) => <div key={o.id || o._id} className="rounded-xl bg-slate-50 p-3">{o.orderNumber} • {o.orderStatus || o.status}</div>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
