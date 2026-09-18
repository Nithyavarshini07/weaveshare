import { Link } from 'react-router-dom';

const features = [
  { title: 'REDUCE WASTE', description: 'Give leftover yarn a second life.' },
  { title: 'EXTRA INCOME', description: 'Help sellers earn from unused materials.' },
  { title: 'AFFORDABLE MATERIALS', description: 'Help small-scale workers access affordable yarn.' },
  { title: 'SUPPORT ARTISANS', description: 'Connect local sellers directly with buyers.' },
];

const steps = [
  { title: 'SELLERS', list: ['Register', 'Upload Yarn', 'Enter Weight', 'Set Price', 'Receive Orders'] },
  { title: 'BUYERS', list: ['Register', 'Browse Yarn', 'Select Material', 'Place Order', 'Track Delivery'] },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#dfeef0] text-slate-800">
      <header className="mx-auto max-w-7xl px-4 py-6">
        <nav className="card-shell flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="WeaveShare logo" className="h-12 w-auto" />
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#home" className="text-sm font-medium text-slate-700">Home</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-700">How It Works</a>
            <a href="#for-sellers" className="text-sm font-medium text-slate-700">For Sellers</a>
            <a href="#for-buyers" className="text-sm font-medium text-slate-700">For Buyers</a>
            <a href="#about" className="text-sm font-medium text-slate-700">About</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="secondary-btn px-4 py-2 text-sm">Login</Link>
            <Link to="/register" className="primary-btn px-4 py-2 text-sm">Register</Link>
          </div>
        </nav>
      </header>

      <main id="home" className="mx-auto max-w-7xl px-4 pb-16">
        <section className="grid items-center gap-8 rounded-[36px] bg-[#b9e9ef] px-6 py-10 shadow-soft md:grid-cols-2 md:px-10 lg:px-16">
          <div>
            <div className="mb-6 inline-flex items-center rounded-full bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark">WeaveShare</div>
            <h1 className="max-w-xl text-4xl font-black leading-tight text-brand-dark md:text-5xl">
              Turn Leftover Yarn Into Opportunity
            </h1>
            <p className="mt-5 max-w-xl text-base text-slate-700 md:text-lg">
              Connect unused yarn with people who need it — reducing waste while creating additional income for artisans and affordable materials for small-scale workers.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="primary-btn">START SELLING</Link>
              <Link to="/buyer" className="secondary-btn">BUY MATERIALS</Link>
            </div>
          </div>

          <div className="rounded-[32px] bg-[#dff4f8] p-3 shadow-soft">
            <div className="h-[420px] overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8),_rgba(255,255,255,0)_30%),linear-gradient(135deg,#8b5c3c,#d9a36f,#5d9ea8,#4b2f2a)] relative">
              <div className="absolute inset-0 opacity-80" style={{ backgroundImage: 'linear-gradient(120deg, rgba(255,255,255,0.15) 0, rgba(255,255,255,0.15) 15%, transparent 15%, transparent 30%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 65%, transparent 65%, transparent 80%, rgba(255,255,255,0.1) 80%)' }} />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#175870]/30 to-transparent" />
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-8 text-center">
            <div className="badge mx-auto">Why WeaveShare</div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="card-shell p-6 text-center">
                <div className="mb-4 text-xl font-black text-brand-teal">{feature.title}</div>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mt-16">
          <div className="mb-8 text-center">
            <div className="badge mx-auto">How It Works</div>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {steps.map((step) => (
              <div key={step.title} className="card-shell p-6">
                <h3 className="mb-6 text-2xl font-black text-brand-dark">{step.title}</h3>
                <ol className="space-y-3">
                  {step.list.map((item, index) => (
                    <li key={item} className="flex items-center gap-3 text-slate-700">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal text-sm font-bold text-white">{index + 1}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="mt-16 card-shell p-8">
          <h3 className="text-3xl font-black text-brand-dark">Mission</h3>
          <p className="mt-4 max-w-3xl text-slate-600">
            WeaveShare gives leftover yarn a second life by connecting textile sellers with people who need affordable materials.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {['Reduce waste', 'Create additional income', 'Support small-scale workers', 'Promote circular production'].map((item) => (
              <div key={item} className="rounded-2xl bg-brand-cyan p-4 text-sm font-semibold text-brand-dark">{item}</div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
