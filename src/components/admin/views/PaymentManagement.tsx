import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Check, X, Search, Image as ImageIcon } from 'lucide-react';

export default function PaymentManagement({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'payments'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      const items: any[] = [];
      snap.forEach(d => {
         const data = d.data();
         if (data.status === filter || filter === 'all') {
            items.push({ id: d.id, ...data });
         }
      });
      setPayments(items);
    } catch (err) {
      console.error(err);
      onShowToast("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (paymentId: string, userId: string, newStatus: 'approved' | 'rejected', amountStr: string) => {
    try {
       // get credits amount from plan or default
       let creditsToAdd = 0;
       
       const updates: any = { status: newStatus };
       if (newStatus === 'rejected') {
          const reason = prompt("Enter rejection reason (optional):");
          if (reason) updates.rejection_reason = reason;
       }
       
       await updateDoc(doc(db, 'payments', paymentId), updates);
       
       if (newStatus === 'approved') {
          // fetch user doc to check current balance
          const userSnap = await getDoc(doc(db, 'users', userId));
          if (userSnap.exists()) {
             const currentBalance = userSnap.data().balance || 0;
             await updateDoc(doc(db, 'users', userId), { balance: currentBalance + Number(amountStr) });
          }
       }
       
       await setDoc(doc(collection(db, 'audit_logs')), {
         admin: 'Admin',
         action: `Marked payment ${paymentId} as ${newStatus}`,
         target: userId,
         timestamp: new Date()
       });

       onShowToast(`Payment ${newStatus} successfully`);
       fetchPayments();
    } catch (e: any) {
       onShowToast("Error: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end">
         <h2 className="text-2xl font-bold">Payment Management</h2>
         <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg py-2 px-4 focus:border-[#1497F3] outline-none">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Payments</option>
         </select>
       </div>

       <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
         {loading ? (
            <div className="p-8 text-center text-white/50">Loading payments...</div>
         ) : payments.length === 0 ? (
            <div className="p-8 text-center text-white/50">No {filter} payments found.</div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white/5 text-white/50 uppercase text-xs">
                     <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Plan / Option</th>
                        <th className="px-6 py-4">Method</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-center">Receipt</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {payments.map(p => (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                           <td className="px-6 py-4 font-mono text-xs">{p.id.slice(0, 8)}...</td>
                           <td className="px-6 py-4">{p.user_email || p.user_id}</td>
                           <td className="px-6 py-4 text-[#1497F3] font-bold">{p.amount}</td>
                           <td className="px-6 py-4">{p.plan_id || 'Top-up'}</td>
                           <td className="px-6 py-4 uppercase">{p.method}</td>
                           <td className="px-6 py-4 text-white/50">
                              {p.created_at?.toDate ? p.created_at.toDate().toLocaleDateString() : 'N/A'}
                           </td>
                           <td className="px-6 py-4 text-center">
                              {p.screenshot_url ? (
                                 <a href={p.screenshot_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#1497F3] hover:underline">
                                    <ImageIcon size={14} /> View
                                 </a>
                              ) : '-'}
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                 {p.status === 'pending' ? (
                                    <>
                                       <button onClick={() => handleStatusChange(p.id, p.user_id, 'approved', p.amount)} className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center hover:bg-green-500/40 transition-colors" title="Approve">
                                          <Check size={16} strokeWidth={3} />
                                       </button>
                                       <button onClick={() => handleStatusChange(p.id, p.user_id, 'rejected', p.amount)} className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/40 transition-colors" title="Reject">
                                          <X size={16} strokeWidth={3} />
                                       </button>
                                    </>
                                 ) : (
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${p.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                       {p.status}
                                    </span>
                                 )}
                              </div>
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
