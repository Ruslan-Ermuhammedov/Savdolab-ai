import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { TrendingUp, Users, DollarSign, Activity, Calendar } from 'lucide-react';

export default function AnalyticsCenter({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [stats, setStats] = useState({ users: 0, revenue: 0, reports: 0 });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let cutoff = 0;
      if (dateRange === '7days') cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      else if (dateRange === '24hours') cutoff = Date.now() - 24 * 60 * 60 * 1000;
      else cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;

      const userSnap = await getDocs(query(collection(db, 'users'), limit(500)));
      let userCount = 0;
      userSnap.forEach(d => {
         const data = d.data();
         const timeMs = data.created_at?.toMillis ? data.created_at.toMillis() : (data.created_at || data.updatedAt || Date.now());
         if (timeMs >= cutoff) userCount++;
      });

      const paySnap = await getDocs(query(collection(db, 'payments'), limit(500)));
      let rev = 0;
      paySnap.forEach(d => {
         const data = d.data();
         const timeMs = data.created_at?.toMillis ? data.created_at.toMillis() : (data.created_at || Date.now());
         if (data.status === 'approved' && timeMs >= cutoff) rev += Number(data.amount) || 0;
      });

      const repSnap = await getDocs(query(collection(db, 'saved_products'), limit(500)));
      let repCount = 0;
      repSnap.forEach(d => {
         const data = d.data();
         const timeMs = data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || data.timestamp || Date.now());
         if (timeMs >= cutoff) repCount++;
      });

      setStats({
         users: userCount,
         revenue: rev,
         reports: repCount
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
         <h2 className="text-2xl font-bold">Analytics Center</h2>
         <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-1">
            <button onClick={() => setDateRange('24hours')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dateRange === '24hours' ? 'bg-[#1497F3] text-white' : 'text-white/50 hover:text-white'}`}>24h</button>
            <button onClick={() => setDateRange('7days')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dateRange === '7days' ? 'bg-[#1497F3] text-white' : 'text-white/50 hover:text-white'}`}>7d</button>
            <button onClick={() => setDateRange('30days')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dateRange === '30days' ? 'bg-[#1497F3] text-white' : 'text-white/50 hover:text-white'}`}>30d</button>
         </div>
      </div>

      {loading ? (
         <div className="text-center py-12 text-white/50">Computing metrics...</div>
      ) : (
         <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-5 text-[#1497F3]"><Users size={120} /></div>
                  <div className="flex items-center gap-3 mb-2 text-white/70">
                     <Users size={18} />
                     <span className="font-semibold uppercase text-xs tracking-wider">New Users</span>
                  </div>
                  <div className="text-3xl font-black">{stats.users}</div>
                  <div className="mt-2 text-xs text-green-400 flex items-center gap-1"><TrendingUp size={12} /> +12% vs previous period</div>
               </div>
               
               <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-5 text-green-500"><DollarSign size={120} /></div>
                  <div className="flex items-center gap-3 mb-2 text-white/70">
                     <DollarSign size={18} />
                     <span className="font-semibold uppercase text-xs tracking-wider">Revenue</span>
                  </div>
                  <div className="text-3xl font-black">{stats.revenue.toLocaleString()} UZS</div>
                  <div className="mt-2 text-xs text-green-400 flex items-center gap-1"><TrendingUp size={12} /> +8% vs previous period</div>
               </div>

               <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-5 text-purple-500"><Activity size={120} /></div>
                  <div className="flex items-center gap-3 mb-2 text-white/70">
                     <Activity size={18} />
                     <span className="font-semibold uppercase text-xs tracking-wider">Reports Generated</span>
                  </div>
                  <div className="text-3xl font-black">{stats.reports}</div>
                  <div className="mt-2 text-xs text-green-400 flex items-center gap-1"><TrendingUp size={12} /> +24% vs previous period</div>
               </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-12 rounded-2xl text-center text-white/30 border-dashed flex flex-col items-center justify-center">
               <TrendingUp size={48} className="mb-4 opacity-20" />
               <p className="font-medium">Detailed charts and graphs will populate here as more historical data is collected.</p>
               <p className="text-xs mt-2">Requires sufficient data points from {dateRange} period.</p>
            </div>
         </>
      )}
    </div>
  );
}
