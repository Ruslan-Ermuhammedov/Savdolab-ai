import React from 'react';
import { TrendingProductsData } from '../types';
import { TrendingUp, Users, Target, CircleDollarSign, Flame, Activity } from 'lucide-react';
import MarketTrendsChart from './MarketTrendsChart';
import { useI18n } from '../i18n';

export default function TrendingProductsView({ data }: { data: TrendingProductsData }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-6" id="report-content">
      <div className="bg-[#111827] border border-white/10 rounded-[24px] p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
           <Flame className="text-orange-500" />
           Top Trending: {data.categoryAnalyzed}
        </h2>
        <p className="text-white/60 text-sm mb-6">{t('reports.promising')}</p>

        <div className="space-y-4">
           {data.products.map((product, idx) => (
              <div 
                key={idx} 
                className={`p-5 rounded-2xl border ${
                  product.isPromising 
                  ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
                } transition-colors`}
              >
                 <div className="flex justify-between items-start mb-3">
                   <h3 className="text-lg font-bold text-white flex items-center gap-2">
                     <span className="text-white/30 text-sm font-mono w-5 ">{idx + 1}.</span>
                     {product.name}
                   </h3>
                   {product.isPromising && (
                     <span className="bg-[#1497F3] text-white text-[10px] px-2 py-1 rounded-full font-bold tracking-wider uppercase flex items-center gap-1">
                       <Flame size={12} /> {t('reports.promising')}
                     </span>
                   )}
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <TrendingUp size={14} className="text-blue-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/50 uppercase">{t('reports.growthRate')}</span>
                        <span className="text-white/90 font-medium">{product.growthRate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                         <Target size={14} className="text-purple-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/50 uppercase">{t('reports.competition')}</span>
                        <span className="text-white/90 font-medium">{product.competitionLevel}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                         <CircleDollarSign size={14} className="text-green-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/50 uppercase">{t('reports.estimatedMargin')}</span>
                        <span className="text-white/90 font-medium">{product.estimatedMargin}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                         <Users size={14} className="text-orange-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/50 uppercase">{t('reports.targetAudience')}</span>
                        <span className="text-white/90 font-medium">{product.targetAudience}</span>
                      </div>
                    </div>
                 </div>

                 {product.trendData && product.trendData.length > 0 && (
                    <div className="mt-6 bg-black/20 p-4 shrink-0 rounded-xl border border-white/5">
                      <h4 className="text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-2">
                         <Activity size={12} className="text-blue-400" /> {t('reports.marketTrends')}
                      </h4>
                      <MarketTrendsChart data={product.trendData} />
                    </div>
                 )}
              </div>
           ))}
        </div>
      </div>
    </div>
  );
}
