import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { FileText, ExternalLink } from 'lucide-react';

export default function SavedReportsManager({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'saved_products'), orderBy('saved_at', 'desc'), limit(100));
      const snap = await getDocs(q);
      const items: any[] = [];
      snap.forEach(d => {
         items.push({ id: d.id, ...d.data() });
      });
      setReports(items);
    } catch (err) {
      console.error(err);
      // Collections may not exist, let's gracefully fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold">Saved Reports</h2>
         <span className="text-sm text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">Latest 100 reports</span>
      </div>
      
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
         {loading ? (
            <div className="text-center py-12 text-white/50">Loading reports...</div>
         ) : reports.length === 0 ? (
            <div className="text-center py-12 text-white/50 border border-white/10 border-dashed rounded-xl m-6">No saved reports found across the system.</div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white/5 text-white/50 uppercase text-xs">
                     <tr>
                        <th className="px-6 py-4">Report / Product Name</th>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Status / Interest</th>
                        <th className="px-6 py-4">Saved At</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {reports.map((r, i) => (
                        <tr key={r.id || i} className="hover:bg-white/5 transition-colors">
                           <td className="px-6 py-4 font-medium flex items-center gap-2">
                              <FileText size={16} className="text-[#1497F3]" />
                              {r.product_name || r.name || 'Untitled Report'}
                           </td>
                           <td className="px-6 py-4">{r.user_email || r.user_id || 'Unknown User'}</td>
                           <td className="px-6 py-4">
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#1497F3]/20 text-[#1497F3]">{r.interest_level || r.status || 'SAVED'}</span>
                           </td>
                           <td className="px-6 py-4 text-white/50 text-xs">
                              {r.saved_at?.toDate ? r.saved_at.toDate().toLocaleString() : 'N/A'}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
    </div>
  );
}
