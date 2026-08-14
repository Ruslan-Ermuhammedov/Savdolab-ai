import React from 'react';
import { CompetitorSpyData } from '../types';
import { Store, Crosshair, TrendingUp, ShieldAlert, Zap, Target } from 'lucide-react';
import { useI18n } from '../i18n';

export default function CompetitorSpyView({ data }: { data: CompetitorSpyData }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-6" id="report-content">
      <div className="bg-[#111827] border border-white/10 rounded-[24px] p-6 shadow-2xl">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
           <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1497F3] to-[#7B4DFF] flex items-center justify-center shadow-lg">
             <Store size={32} className="text-white" />
           </div>
           <div>
             <h2 className="text-3xl font-bold text-white mb-1">{data.storeName}</h2>
             <span className="text-white/50 text-sm flex items-center gap-2">
                <Crosshair size={14} /> Competitor Intelligence Report
             </span>
           </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
           <div className="bg-white/5 rounded-xl p-5 border border-white/5">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Target size={16} className="text-[#1497F3]" /> {t('reports.topProducts')}
              </h3>
              <ul className="space-y-2">
                {data.topProducts.map((p, i) => (
                  <li key={i} className="text-white/90 text-sm flex items-start gap-2">
                     <span className="text-blue-400 font-mono text-xs mt-0.5">{i+1}.</span>
                     {p}
                  </li>
                ))}
              </ul>
           </div>
           
           <div className="flex flex-col gap-6">
              <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                <h3 className="text-xs text-white/50 uppercase mb-2">{t('reports.businessModel')}</h3>
                <p className="text-sm text-white/90 leading-relaxed">{data.businessModel}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                <h3 className="text-xs text-white/50 uppercase mb-2">{t('reports.targetAudience')}</h3>
                <p className="text-sm text-white/90 leading-relaxed">{data.targetAudience}</p>
              </div>
           </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
           <div className="bg-red-500/10 rounded-xl p-5 border border-red-500/20">
              <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <ShieldAlert size={16} /> {t('reports.weaknesses')}
              </h3>
              <ul className="space-y-3">
                {data.weaknesses.map((w, i) => (
                  <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                     <span className="text-red-400 uppercase text-[10px] mt-1 font-bold">»</span>
                     {w}
                  </li>
                ))}
              </ul>
           </div>
           
           <div className="bg-green-500/10 rounded-xl p-5 border border-green-500/20">
              <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Zap size={16} /> {t('reports.growthOpportunities')}
              </h3>
              <ul className="space-y-3">
                {data.growthOpportunities.map((g, i) => (
                  <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                     <span className="text-green-400 uppercase text-[10px] mt-1 font-bold">»</span>
                     {g}
                  </li>
                ))}
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
