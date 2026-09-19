import { useState } from 'react';
import { Star } from 'lucide-react';

type StarRatingProps = {
  value: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
};

const sizes = { sm: 14, md: 20, lg: 28 } as const;

export default function StarRating({ value, onChange, size = 'md', readonly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const interactive = !readonly && Boolean(onChange);
  const displayValue = interactive && hovered ? hovered : Math.max(0, Math.min(5, value));

  return (
    <div
      className="flex items-center gap-0.5"
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`${value} out of 5 stars`}
      onMouseLeave={() => interactive && setHovered(0)}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, displayValue - index));
        const starSize = sizes[size];
        return (
          <button
            key={index}
            type="button"
            disabled={!interactive}
            role={interactive ? 'radio' : undefined}
            aria-checked={interactive ? Math.round(displayValue) === index + 1 : undefined}
            aria-label={`${index + 1} star${index === 0 ? '' : 's'}`}
            className={interactive ? 'cursor-pointer rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40' : 'cursor-default'}
            onMouseEnter={() => interactive && setHovered(index + 1)}
            onClick={() => interactive && onChange?.(index + 1)}
            onKeyDown={(event) => {
              if (interactive && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                onChange?.(index + 1);
              }
            }}
          >
            <span className="relative block" style={{ width: starSize, height: starSize }}>
              <Star size={starSize} className="absolute inset-0 text-slate-300" />
              {fill > 0 && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star size={starSize} className="max-w-none fill-amber-400 text-amber-400" />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
