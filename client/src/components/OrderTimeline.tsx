import { Check } from 'lucide-react';

type OrderTimelineProps = {
  status: string;
  compact?: boolean;
};

const steps = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'] as const;
const labels = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'] as const;

export default function OrderTimeline({ status, compact = false }: OrderTimelineProps) {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === 'CANCELLED') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
        Order Cancelled
      </div>
    );
  }

  const currentIndex = Math.max(0, steps.indexOf(normalizedStatus as typeof steps[number]));

  return (
    <div className={`overflow-x-auto ${compact ? 'py-1' : 'py-2'}`}>
      <div className="flex min-w-[560px] items-start px-1">
        {steps.map((step, index) => {
          const completed = index < currentIndex;
          const current = index === currentIndex;
          return (
            <div key={step} className="flex min-w-0 flex-1 items-start">
              <div className="flex min-w-[76px] flex-col items-center gap-2">
                <div
                  className={[
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    completed || current
                      ? 'bg-brand-teal text-white'
                      : 'border-2 border-slate-300 bg-white text-slate-400',
                    current ? 'ring-4 ring-brand-teal/30 animate-pulse' : '',
                  ].join(' ')}
                >
                  {completed ? <Check size={18} strokeWidth={3} /> : <span className="text-sm font-bold">{index + 1}</span>}
                </div>
                <span className={`text-center text-xs font-semibold ${completed || current ? 'text-brand-dark' : 'text-slate-400'}`}>
                  {labels[index]}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`mt-5 h-0.5 flex-1 ${index < currentIndex ? 'bg-brand-teal' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
