import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Mail, MessageCircle, Check, X } from 'lucide-react';

export default function SupportCenter({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'support_requests'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const items: any[] = [];
      snap.forEach(d => {
         const data = d.data();
         if (data.status === filter || filter === 'all') {
            items.push({ id: d.id, ...data });
         }
      });
      setRequests(items);
    } catch (err) {
      console.error(err);
      // Suppress error to avoid annoyance if collection doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id: string, newStatus: string) => {
     try {
        await updateDoc(doc(db, 'support_requests', id), { status: newStatus });
        onShowToast(`Request marked as ${newStatus}`);
        fetchRequests();
     } catch (err: any) {
        onShowToast("Error: " + err.message);
     }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
         <h2 className="text-2xl font-bold">Support Center</h2>
         <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg py-2 px-4 focus:border-[#1497F3] outline-none">
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="all">All Requests</option>
         </select>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
         {loading ? (
            <div className="p-12 text-center text-white/50">Loading requests...</div>
         ) : requests.length === 0 ? (
            <div className="p-12 text-center text-white/50 border border-white/10 border-dashed rounded-xl m-6">No {filter} support requests.</div>
         ) : (
            <div className="divide-y divide-white/5">
               {requests.map(req => (
                  <div key={req.id} className="p-6 hover:bg-white/5 transition-colors">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-lg">{req.subject || 'Support Request'}</h3>
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${req.status === 'open' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                                 {req.status}
                              </span>
                           </div>
                           <p className="text-sm text-white/50">From: <span className="text-white">{req.user_email || req.user_id}</span> • {req.timestamp?.toDate ? req.timestamp.toDate().toLocaleString() : new Date(req.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                           {req.status === 'open' ? (
                              <button onClick={() => handleStatus(req.id, 'closed')} className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                                 <Check size={14} /> Close
                              </button>
                           ) : (
                              <button onClick={() => handleStatus(req.id, 'open')} className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                                 <X size={14} /> Reopen
                              </button>
                           )}
                        </div>
                     </div>
                     <div className="bg-black/30 p-4 rounded-xl text-sm border border-white/5">
                        <p>{req.message}</p>
                     </div>
                     <div className="mt-4 flex gap-3">
                        {req.user_email && (
                           <a href={`mailto:${req.user_email}`} className="flex items-center gap-2 text-sm text-[#1497F3] hover:underline">
                              <Mail size={14} /> Reply via Email
                           </a>
                        )}
                        {req.telegram_username && (
                           <a href={`https://t.me/${req.telegram_username.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#1497F3] hover:underline">
                              <MessageCircle size={14} /> Reply via Telegram
                           </a>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}
