import React from 'react';
import { motion } from 'framer-motion';
import { WinningProductData } from '../types';
import MarketTrendsChart from './MarketTrendsChart';
import { Target, Activity, Zap, DollarSign, Award } from 'lucide-react';

export default function WinningProductView({ data }: { data: WinningProductData }) {
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
             <span className="text-white/50 text-xs uppercase mb-1">Trend</span>
             <span className="text-xl font-bold text-white">{data.trendScore}/100</span>
           </div>
           <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center">
             <Target className="text-purple-400 mb-2" size={20} />
             <span className="text-white/50 text-xs uppercase mb-1">Demand</span>
             <span className="text-xl font-bold text-white">{data.demandScore}/100</span>
           </div>
           <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center">
             <Zap className="text-red-400 mb-2" size={20} />
             <span className="text-white/50 text-xs uppercase mb-1">Competition</span>
             <span className="text-xl font-bold text-white">{data.competitionScore}/100</span>
           </div>
           <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center">
             <DollarSign className="text-green-400 mb-2" size={20} />
             <span className="text-white/50 text-xs uppercase mb-1">Profitability</span>
             <span className="text-xl font-bold text-white">{data.profitScore}/100</span>
           </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
           <div className="flex flex-col gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                 <h4 className="text-xs text-white/50 uppercase mb-2">Target Audience</h4>
                 <p className="text-sm text-white/90">{data.targetAudience}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                 <h4 className="text-xs text-white/50 uppercase mb-2">Problem Solved</h4>
                 <p className="text-sm text-white/90">{data.problemSolved}</p>
              </div>
           </div>
           
           <div className="flex flex-col">
              <div className={`p-6 rounded-xl flex items-center justify-between border ${
                data.recommendation === 'SELL' ? 'bg-green-500/10 border-green-500/30' :
                data.recommendation === 'AVOID' ? 'bg-red-500/10 border-red-500/30' :
                'bg-yellow-500/10 border-yellow-500/30'
              }`}>
                 <div className="flex flex-col">
                   <h4 className="text-sm font-medium text-white/70">Final Recommendation</h4>
                   <span className={`text-3xl font-black tracking-tight ${
                     data.recommendation === 'SELL' ? 'text-green-400' :
                     data.recommendation === 'AVOID' ? 'text-red-400' :
                     'text-yellow-400'
                   }`}>{data.recommendation}</span>
                 </div>
                 <Award className={`opacity-80 ${
                     data.recommendation === 'SELL' ? 'text-green-400' :
                     data.recommendation === 'AVOID' ? 'text-red-400' :
                     'text-yellow-400'
                   }`} size={48} />
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
              <h4 className="text-[10px] text-white/50 uppercase mb-1">TikTok Potential</h4>
              <p className="text-sm text-white/90 font-medium">{data.tiktokPotential}</p>
           </div>
           <div className="bg-black/20 p-4 rounded-xl">
              <h4 className="text-[10px] text-white/50 uppercase mb-1">FB Ads Potential</h4>
              <p className="text-sm text-white/90 font-medium">{data.fbAdsPotential}</p>
           </div>
           <div className="bg-black/20 p-4 rounded-xl">
              <h4 className="text-[10px] text-white/50 uppercase mb-1">Saturation Level</h4>
              <p className="text-sm text-white/90 font-medium">{data.saturationLevel}</p>
           </div>
        </div>

        {data.trendData && data.trendData.length > 0 && (
           <div className="mt-8 bg-black/20 p-6 rounded-2xl border border-white/5">
             <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-2">
               <Activity size={14} className="text-[#1497F3]" /> Market Trends
             </h3>
             <MarketTrendsChart data={data.trendData} />
           </div>
        )}
      </div>
    </div>
  );
}
