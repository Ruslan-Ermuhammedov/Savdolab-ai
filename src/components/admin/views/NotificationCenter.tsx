import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, limit, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Bell, Send, Trash, Plus } from 'lucide-react';

export default function NotificationCenter({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', message: '', targetUserId: '', type: 'info' });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(50));
      const snap = await getDocs(q);
      const items: any[] = [];
      snap.forEach(d => {
         items.push({ id: d.id, ...d.data() });
      });
      setNotifications(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!newNotif.title || !newNotif.message) {
        onShowToast("Title and message are required");
        return;
     }

     setIsSending(true);
     try {
        const id = Date.now().toString();
        const data = {
           title: newNotif.title,
           message: newNotif.message,
           targetUserId: newNotif.targetUserId.trim() || 'global',
           type: newNotif.type,
           timestamp: serverTimestamp(),
           readBy: []
        };
        await setDoc(doc(db, 'notifications', id), data);
        
        await setDoc(doc(collection(db, 'audit_logs')), {
           admin: 'Admin',
           action: `Sent notification (${data.targetUserId})`,
           target: data.title,
           timestamp: new Date()
        });

        onShowToast("Notification sent");
        setIsCreating(false);
        setNewNotif({ title: '', message: '', targetUserId: '', type: 'info' });
        fetchNotifications();
     } catch (err: any) {
        onShowToast("Error: " + err.message);
     } finally {
        setIsSending(false);
     }
  };

  const handleDelete = async (id: string) => {
     if (!confirm("Delete this notification?")) return;
     try {
        await deleteDoc(doc(db, 'notifications', id));
        onShowToast("Notification deleted");
        setNotifications(prev => prev.filter(n => n.id !== id));
     } catch (err: any) {
        onShowToast("Error: " + err.message);
     }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold">Notification Center</h2>
         <button onClick={() => setIsCreating(true)} className="px-4 py-2 bg-[#1497F3] hover:bg-[#2081C3] text-white rounded-xl font-medium transition-colors flex items-center gap-2">
            <Plus size={16} /> New Notification
         </button>
      </div>

      {isCreating && (
         <div className="bg-[#0A1322] border border-[#1497F3]/30 p-6 rounded-2xl w-full max-w-2xl relative shadow-[0_0_30px_rgba(20,151,243,0.1)]">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
               <Send size={18} className="text-[#1497F3]" /> Send Notification
            </h3>
            <form onSubmit={handleSend} className="space-y-4">
               <div>
                  <label className="block text-sm text-white/50 mb-1">Target</label>
                  <select value={newNotif.targetUserId ? 'user' : 'global'} onChange={e => setNewNotif({...newNotif, targetUserId: e.target.value === 'global' ? '' : 'temp'})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3] text-sm">
                     <option value="global">All Users (Global)</option>
                     <option value="user">Specific User</option>
                  </select>
               </div>
               
               {newNotif.targetUserId !== '' && (
                  <div>
                     <label className="block text-sm text-white/50 mb-1">Specific User ID</label>
                     <input type="text" value={newNotif.targetUserId === 'temp' ? '' : newNotif.targetUserId} onChange={e => setNewNotif({...newNotif, targetUserId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3] text-sm" placeholder="Enter User UUID..." required />
                  </div>
               )}

               <div>
                  <label className="block text-sm text-white/50 mb-1">Type</label>
                  <select value={newNotif.type} onChange={e => setNewNotif({...newNotif, type: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3] text-sm">
                     <option value="info">Info (Blue)</option>
                     <option value="success">Success (Green)</option>
                     <option value="warning">Warning (Orange)</option>
                     <option value="error">Error (Red)</option>
                  </select>
               </div>

               <div>
                  <label className="block text-sm text-white/50 mb-1">Title</label>
                  <input type="text" value={newNotif.title} onChange={e => setNewNotif({...newNotif, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3] text-sm" placeholder="e.g. Server Maintenance" required />
               </div>

               <div>
                  <label className="block text-sm text-white/50 mb-1">Message</label>
                  <textarea value={newNotif.message} onChange={e => setNewNotif({...newNotif, message: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3] text-sm min-h-[100px]" placeholder="Detailed message..."></textarea>
               </div>

               <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors">Cancel</button>
                  <button type="submit" disabled={isSending} className="px-6 py-2.5 bg-[#1497F3] hover:bg-[#2081C3] text-white rounded-xl font-bold transition-colors disabled:opacity-50">
                     {isSending ? 'Sending...' : 'Send'}
                  </button>
               </div>
            </form>
         </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
         {loading ? (
            <div className="text-center py-12 text-white/50">Loading notifications...</div>
         ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-white/50 border border-white/10 border-dashed rounded-xl m-6">No notifications have been sent.</div>
         ) : (
            <div className="divide-y divide-white/5">
               {notifications.map(n => (
                  <div key={n.id} className="p-6 hover:bg-white/5 transition-colors flex justify-between items-start">
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                           <Bell size={16} className={n.type === 'info' ? 'text-blue-400' : n.type === 'success' ? 'text-green-400' : n.type === 'warning' ? 'text-orange-400' : 'text-red-400'} />
                           <h3 className="font-bold text-lg">{n.title}</h3>
                           <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white/10 text-white/70">
                              {n.targetUserId === 'global' ? 'Global' : 'Direct'}
                           </span>
                        </div>
                        <p className="text-sm text-white/70 mb-2">{n.message}</p>
                        <p className="text-xs text-white/40">
                           {n.targetUserId !== 'global' && <span className="mr-3">Target: <span className="text-[#1497F3] font-mono">{n.targetUserId}</span></span>}
                           {n.timestamp?.toDate ? n.timestamp.toDate().toLocaleString() : 'Just now'}
                        </p>
                     </div>
                     <button onClick={() => handleDelete(n.id)} className="w-8 h-8 rounded-lg outline-none bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                        <Trash size={14} />
                     </button>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}
