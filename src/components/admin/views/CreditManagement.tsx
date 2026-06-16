import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, orderBy, limit } from 'firebase/firestore';
import { History, Zap } from 'lucide-react';

export default function CreditManagement({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // For simplicity, we filter audit_logs that mention credits
      const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
      const snap = await getDocs(q);
      const items: any[] = [];
      snap.forEach(d => {
         const data = d.data();
         if (data.action?.toLowerCase().includes('credit')) {
            items.push({ id: d.id, ...data });
         }
      });
      setLogs(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Credit History & Logs</h2>
      <p className="text-white/50">View recent credit additions, removals, and user consumption.</p>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-6">
         {loading ? (
            <div className="text-center py-12 text-white/50">Loading logs...</div>
         ) : logs.length === 0 ? (
            <div className="text-center py-12 text-white/50 border border-white/10 border-dashed rounded-xl">No credit logs found. Update user credits in User Management.</div>
         ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
               {logs.map(log => (
                  <div key={log.id} className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
                     <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{log.action}</span>
                        <span className="text-white/50 text-xs mt-1">Target: <span className="text-[#1497F3] font-mono">{log.target}</span> | Admin: {log.admin}</span>
                     </div>
                     <div className="text-white/40 text-xs text-right shrink-0">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : new Date(log.timestamp).toLocaleString()}
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}
