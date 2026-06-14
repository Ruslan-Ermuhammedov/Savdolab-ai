import React from 'react';
import { AdAnalyzerData } from '../types';
import { Sparkles, Megaphone, Lightbulb, TrendingUp, ShieldCheck } from 'lucide-react';

export default function AdAnalyzerView({ data }: { data: AdAnalyzerData }) {
  return (
    <div className="flex flex-col gap-6" id="report-content">
      <div className="bg-[#111827] border border-white/10 rounded-[24px] p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
           <Megaphone className="text-[#1497F3]" size={28} />
           <h2 className="text-2xl font-bold text-white">Ad Performance Analysis</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <div className="bg-gradient-to-b from-[#111827] to-[#1A2333] p-5 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
             <div className="text-[10px] text-white/50 uppercase tracking-widest mb-2 font-bold">Hook Score</div>
             <div className="text-4xl font-black text-[#89E4FF]">{data.hookScore}</div>
           </div>
           <div className="bg-gradient-to-b from-[#111827] to-[#1A2333] p-5 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
             <div className="text-[10px] text-white/50 uppercase tracking-widest mb-2 font-bold">Creativity</div>
             <div className="text-4xl font-black text-purple-400">{data.creativityScore}</div>
           </div>
           <div className="bg-gradient-to-b from-[#111827] to-[#1A2333] p-5 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
             <div className="text-[10px] text-white/50 uppercase tracking-widest mb-2 font-bold">Conversion</div>
             <div className="text-4xl font-black text-green-400">{data.conversionScore}</div>
           </div>
           <div className="bg-gradient-to-b from-[#111827] to-[#1A2333] p-5 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
             <div className="text-[10px] text-white/50 uppercase tracking-widest mb-2 font-bold">Trust</div>
             <div className="text-4xl font-black text-blue-400">{data.trustScore}</div>
           </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
           <div className="bg-white/5 rounded-xl p-5 border border-white/5">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">Hook Analysis</h3>
              <p className="text-sm text-white/90 leading-relaxed">{data.hookAnalysis}</p>
           </div>
           <div className="bg-white/5 rounded-xl p-5 border border-white/5">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">Offer Analysis</h3>
              <p className="text-sm text-white/90 leading-relaxed">{data.offerAnalysis}</p>
           </div>
           <div className="bg-white/5 rounded-xl p-5 border border-white/5">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">CTA & Target</h3>
              <p className="text-sm text-white/90 leading-relaxed mb-4">{data.ctaAnalysis}</p>
              <div className="h-px w-full bg-white/10 mb-4" />
              <div className="text-xs text-white/50 uppercase mb-1">Target Audience</div>
              <div className="text-sm text-white/90">{data.targetAudience}</div>
           </div>
        </div>

        <div className="bg-black/20 rounded-xl p-5 border border-white/5 mb-8">
           <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-4">Emotional Triggers</h3>
           <div className="flex flex-wrap gap-2">
             {data.emotionTriggers.map((t, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-[#1497F3]/10 border border-[#1497F3]/30 text-[#89E4FF] text-xs font-semibold">
                  {t}
                </span>
             ))}
           </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20">
           <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
             <Lightbulb className="text-yellow-400" /> AI Generated Ad Variants
           </h3>
           <div className="space-y-4">
             {data.newAdVariants.map((variant, i) => (
                <div key={i} className="bg-black/40 rounded-xl p-5 border border-white/10 relative">
                   <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-400 rounded-l-xl" />
                   <p className="text-sm text-white/90 leading-relaxed pl-2 whitespace-pre-line">{variant}</p>
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
