import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export default function AuditLogs({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(150));
      const snap = await getDocs(q);
      const items: any[] = [];
      snap.forEach(d => {
         items.push({ id: d.id, ...d.data() });
      });
      setLogs(items);
    } catch (err) {
      console.error(err);
      onShowToast("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold">Audit Logs</h2>
         <button onClick={fetchLogs} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
            Refresh
         </button>
      </div>
      
      <p className="text-white/50">Track all administrative actions performed within the system.</p>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
         {loading ? (
            <div className="text-center py-12 text-white/50">Loading logs...</div>
         ) : logs.length === 0 ? (
            <div className="text-center py-12 text-white/50 border border-white/10 border-dashed rounded-xl m-6">No audit logs found.</div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white/5 text-white/50 uppercase text-xs">
                     <tr>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Admin</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Target</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {logs.map(log => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                           <td className="px-6 py-4 text-white/50 font-mono text-xs">
                              {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : new Date(log.timestamp).toLocaleString()}
                           </td>
                           <td className="px-6 py-4 font-medium text-[#1497F3]">{log.admin || 'System Admin'}</td>
                           <td className="px-6 py-4 font-bold">{log.action}</td>
                           <td className="px-6 py-4 text-white/50">{log.target || 'N/A'}</td>
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
