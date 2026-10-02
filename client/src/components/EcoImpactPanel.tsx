import { Droplet, Leaf, Sprout, TreePine } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { EcoStats, MonthlyImpact } from '../lib/mockEco';

type EcoImpactPanelProps = {
  stats: EcoStats;
  monthly: MonthlyImpact[];
  variant?: 'seller' | 'admin';
};

export default function EcoImpactPanel({ stats, monthly, variant = 'seller' }: EcoImpactPanelProps) {
  const { t } = useTranslation();
  const isAdmin = variant === 'admin';
  const hasMonthlyImpact = monthly.some((item) => item.yarnReusedKg !== 0 || item.co2SavedKg !== 0);

  const cards = [
    { icon: Leaf, label: t('eco.yarnReused'), value: stats.yarnReusedKg, unit: 'kg', caption: t('eco.captionReused') },
    { icon: Sprout, label: t('eco.co2Saved'), value: stats.co2SavedKg, unit: 'kg', caption: t('eco.captionCo2') },
    { icon: Droplet, label: t('eco.waterSaved'), value: stats.waterSavedLiters, unit: 'L', caption: t('eco.captionWater') },
    { icon: TreePine, label: t('eco.treeYears'), value: stats.treesEquivalent, unit: '', caption: t('eco.captionTrees') },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[28px] bg-gradient-to-br from-emerald-50 to-teal-50 p-5 md:flex-row md:items-center">
        <Leaf className="h-10 w-10 shrink-0 text-emerald-600" />
        <div className="flex-1">
          <h2 className="text-2xl font-black text-brand-dark">
            {t(isAdmin ? 'eco.adminHeadline' : 'eco.headline')}
          </h2>
          <p className="text-sm text-slate-500">
            {t(isAdmin ? 'eco.adminSubheadline' : 'eco.subheadline')}
          </p>
        </div>
        <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
          {t(isAdmin ? 'eco.platformWide' : 'eco.thisYear')}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {cards.map(({ icon: Icon, label, value, unit, caption }) => (
          <div key={label} className="card-shell p-5">
            <Icon className="h-6 w-6 text-emerald-600" />
            <p className="mt-3 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-black text-brand-dark">
              {value} {unit}
            </p>
            <p className="mt-2 text-xs text-emerald-600">{caption}</p>
          </div>
        ))}
      </div>

      {isAdmin && (
        <p className="text-center text-sm text-slate-600">
          {t('eco.sellersContributing', { count: stats.sellersContributing })}
        </p>
      )}

      <div className="card-shell p-5">
        <h3 className="text-2xl font-black text-brand-dark">{t('eco.chartTitle')}</h3>
        <p className="mb-4 text-sm text-slate-500">{t('eco.chartSubtitle')}</p>
        {hasMonthlyImpact ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthly}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: unknown) => `${String(value ?? 0)} kg`} />
              <Line type="monotone" dataKey="yarnReusedKg" stroke="#059669" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="co2SavedKg" stroke="#14b8a6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[280px] items-center justify-center text-slate-500">
            {t('eco.noDataYet')}
          </div>
        )}
      </div>

      <div className="card-shell grid gap-3 p-4 md:grid-cols-3">
        <p className="flex items-center gap-2 text-sm text-slate-700"><span className="h-2 w-2 rounded-full bg-emerald-600" />{t('eco.equivTrees', { count: stats.treesEquivalent })}</p>
        <p className="flex items-center gap-2 text-sm text-slate-700"><span className="h-2 w-2 rounded-full bg-emerald-600" />{t('eco.equivKwh', { count: stats.energySavedKwh })}</p>
        <p className="flex items-center gap-2 text-sm text-slate-700"><span className="h-2 w-2 rounded-full bg-emerald-600" />{t('eco.equivOrders', { count: stats.ordersCompleted })}</p>
      </div>

      <div className="card-shell bg-emerald-50/50 p-5">
        <p className="text-sm text-slate-700">{t(isAdmin ? 'eco.ctaAdmin' : 'eco.cta')}</p>
      </div>
    </section>
  );
}
