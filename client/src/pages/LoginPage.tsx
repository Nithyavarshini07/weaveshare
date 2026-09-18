import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('seller@weaveshare.in');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'SELLER' | 'BUYER'>('SELLER');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password, role);
      toast.success('Logged in successfully');
      navigate(role === 'SELLER' ? '/seller' : '/buyer');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#b7e5ec] p-4 py-8">
      <div className="card-shell w-full max-w-sm overflow-hidden bg-[#c6ebf0] p-4 shadow-soft">
        <div className="rounded-[28px] bg-[#dfeef1] p-5">
          <div className="mb-5 flex justify-center">
            <img src="/logo.svg" alt="WeaveShare logo" className="h-20 w-auto" />
          </div>

          <div className="mb-5 text-center text-sm font-semibold text-slate-700">I am a</div>
          <div className="mb-5 grid grid-cols-2 gap-3 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setRole('SELLER')}
              className={`rounded-full px-3 py-3 ${role === 'SELLER' ? 'bg-[#3ca8b8] text-white' : 'bg-white text-slate-700'} shadow-sm`}
            >
              SELLER
            </button>
            <button
              type="button"
              onClick={() => setRole('BUYER')}
              className={`rounded-full px-3 py-3 ${role === 'BUYER' ? 'bg-[#3ca8b8] text-white' : 'bg-white text-slate-700'} shadow-sm`}
            >
              BUYER
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="soft-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
            <input className="soft-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
            <div className="text-right">
              <a href="#" className="text-xs font-medium text-brand-teal">Forgot Password</a>
            </div>
            <button type="submit" className="primary-btn w-full">Login</button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-600">
            Don’t have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-teal">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
