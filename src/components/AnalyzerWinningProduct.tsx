import React from 'react';
import { motion } from 'framer-motion';
import { WinningProductData } from '../types';
import MarketTrendsChart from './MarketTrendsChart';
import { Target, Activity, Zap, DollarSign } from 'lucide-react';
import { useI18n } from '../i18n';

export default function WinningProductView({ data }: { data: WinningProductData }) {
  const { t } = useI18n();
  const finalScore = Math.round(((data.trendScore || 0) + (data.demandScore || 0) + (data.profitScore || 0) + (100 - (data.competitionScore || 0))) / 4);

  return (
    <div className="flex flex-col gap-6" id="report-content">
      <div className="bg-[#111827] border border-white/10 rounded-[24px] p-6 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-2">{data.productName}</h2>
        <div className="text-white/60 text-sm mb-6 flex gap-2">
           <span className="bg-white/5 px-2 py-1 rounded">{data.category}</span>
           <span className="bg-white/5 px-2 py-1 rounded">{data.marketPriceRange}</span>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
           <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center">
             <Activity className="text-blue-400 mb-2" size={20} />
             <span className="text-white/50 text-xs uppercase mb-1">{t('reports.trend')}</span>
             <span className="text-xl font-bold text-white">{data.trendScore}/100</span>
           </div>
           <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center">
             <Target className="text-purple-400 mb-2" size={20} />
             <span className="text-white/50 text-xs uppercase mb-1">{t('reports.demand')}</span>
             <span className="text-xl font-bold text-white">{data.demandScore}/100</span>
           </div>
           <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center">
             <Zap className="text-red-400 mb-2" size={20} />
             <span className="text-white/50 text-xs uppercase mb-1">{t('reports.competition')}</span>
             <span className="text-xl font-bold text-white">{data.competitionScore}/100</span>
           </div>
           <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center">
             <DollarSign className="text-green-400 mb-2" size={20} />
             <span className="text-white/50 text-xs uppercase mb-1">{t('reports.profitability')}</span>
             <span className="text-xl font-bold text-white">{data.profitScore}/100</span>
           </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
           <div className="flex flex-col gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                 <h4 className="text-xs text-white/50 uppercase mb-2">{t('reports.targetAudience')}</h4>
                 <p className="text-sm text-white/90">{data.targetAudience}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                 <h4 className="text-xs text-white/50 uppercase mb-2">{t('reports.problemSolved')}</h4>
                 <p className="text-sm text-white/90">{data.problemSolved}</p>
              </div>
           </div>
           
           <div className="flex flex-col">
              <div className="rounded-2xl bg-[linear-gradient(135deg,#0B1220_0%,#0A101C_100%)] px-5 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.04)]">
                 <div className="flex items-center justify-between gap-5">
                   <div className="flex min-w-0 items-center gap-4">
                     <div className="h-11 w-1 rounded-full bg-[#1497F3]" />
                     <h4 className="text-base font-semibold text-white/80">{t('reports.finalRecommendation')}</h4>
                   </div>
                   <div className="w-32 shrink-0">
                     <div className="flex items-baseline justify-between">
                       <div className="text-[10px] font-semibold uppercase text-white/35">{t('common.score')}</div>
                       <div className="text-3xl font-bold leading-none text-white">{finalScore}</div>
                     </div>
                     <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                       <div className="h-full rounded-full bg-[#1497F3]" style={{ width: `${Math.min(Math.max(finalScore, 0), 100)}%` }} />
                     </div>
                   </div>
                 </div>
              </div>
              <ul className="mt-4 space-y-2">
                 {data.reasons.map((reason, i) => (
                    <li key={i} className="flex gap-2 text-sm text-white/80">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{reason}</span>
                    </li>
                 ))}
              </ul>
           </div>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
           <div className="bg-black/20 p-4 rounded-xl">
              <h4 className="text-[10px] text-white/50 uppercase mb-1">{t('reports.tiktokPotential')}</h4>
              <p className="text-sm text-white/90 font-medium">{data.tiktokPotential}</p>
           </div>
           <div className="bg-black/20 p-4 rounded-xl">
              <h4 className="text-[10px] text-white/50 uppercase mb-1">{t('reports.fbAdsPotential')}</h4>
              <p className="text-sm text-white/90 font-medium">{data.fbAdsPotential}</p>
           </div>
           <div className="bg-black/20 p-4 rounded-xl">
              <h4 className="text-[10px] text-white/50 uppercase mb-1">{t('reports.saturationLevel')}</h4>
              <p className="text-sm text-white/90 font-medium">{data.saturationLevel}</p>
           </div>
        </div>

        {data.trendData && data.trendData.length > 0 && (
           <div className="mt-8 bg-black/20 p-6 rounded-2xl border border-white/5">
             <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-2">
               <Activity size={14} className="text-[#1497F3]" /> {t('reports.marketTrends')}
             </h3>
             <MarketTrendsChart data={data.trendData} />
           </div>
        )}
      </div>
    </div>
  );
}
