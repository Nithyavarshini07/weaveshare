import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<'SELLER' | 'BUYER'>('SELLER');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: '',
    businessName: '',
    buyerType: 'Tailor',
  });

  const handleChange = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role,
        location: form.location,
        businessName: role === 'SELLER' ? form.businessName : undefined,
        buyerType: role === 'BUYER' ? form.buyerType : undefined,
      });
      toast.success('Registration successful');
      navigate(role === 'SELLER' ? '/seller' : '/buyer');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#bfeaf0] p-4 py-8">
      <div className="mx-auto max-w-2xl card-shell p-6 md:p-8">
        <div className="mb-6 flex justify-center">
          <img src="/logo.jpeg" alt="WeaveShare logo" className="h-16 w-auto" />
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 text-sm font-semibold">
          <button type="button" onClick={() => setRole('SELLER')} className={`rounded-full px-4 py-3 ${role === 'SELLER' ? 'bg-brand-teal text-white' : 'bg-slate-100 text-slate-700'}`}>
            SELLER
          </button>
          <button type="button" onClick={() => setRole('BUYER')} className={`rounded-full px-4 py-3 ${role === 'BUYER' ? 'bg-brand-teal text-white' : 'bg-slate-100 text-slate-700'}`}>
            BUYER
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <input className="soft-input md:col-span-2" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Full Name" required />
          <input className="soft-input md:col-span-2" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="Email" required />
          <input className="soft-input" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Phone" required />
          <input className="soft-input" value={form.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="Location" required />
          {role === 'SELLER' ? (
            <>
              <input className="soft-input md:col-span-2" value={form.businessName} onChange={(e) => handleChange('businessName', e.target.value)} placeholder="Seller/Business Name" required />
            </>
          ) : (
            <select className="soft-input md:col-span-2" value={form.buyerType} onChange={(e) => handleChange('buyerType', e.target.value)}>
              {['Tailor','Women Tailor','Artisan','Textile Worker','Small Business','Designer','Other'].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          )}
          <input className="soft-input" type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} placeholder="Password" required />
          <input className="soft-input" type="password" value={form.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} placeholder="Confirm Password" required />
          <button type="submit" className="primary-btn md:col-span-2">Register</button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-600">
          Already have an account? <Link to="/login" className="font-semibold text-brand-teal">Login</Link>
        </div>
      </div>
    </div>
  );
}
