import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { Search, Edit, Trash, CreditCard, Shield, UserX, UserCheck } from 'lucide-react';

export default function UserManagement({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Edit states
  const [addCredits, setAddCredits] = useState(0);
  const [addBalance, setAddBalance] = useState(0);
  const [planId, setPlanId] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      let q = query(collection(db, 'users'), where('email', '==', searchTerm.trim()));
      let snap = await getDocs(q);
      
      if (snap.empty) {
         q = query(collection(db, 'users'), where('__name__', '==', searchTerm.trim()));
         snap = await getDocs(q);
      }
      
      const found: any[] = [];
      snap.forEach(d => found.push({ id: d.id, ...d.data() }));
      setUsers(found);
      
      if (found.length > 0) {
        selectUser(found[0]);
      } else {
        setSelectedUser(null);
        onShowToast("User not found");
      }
    } catch (err) {
      console.error(err);
      onShowToast("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (u: any) => {
    setSelectedUser(u);
    setPlanId(u.plan_id || 'free');
    setAddCredits(0);
    setAddBalance(0);
  };

  const logAction = async (action: string, target: string) => {
    try {
      await setDoc(doc(collection(db, 'audit_logs')), {
        admin: 'Admin', // In real app, we use current admin username
        action,
        target,
        timestamp: new Date()
      });
    } catch(e) {}
  }

  const handleUpdateUser = async () => {
     if (!selectedUser) return;
     try {
        const updates: any = { plan_id: planId };
        if (addCredits !== 0) {
           updates.total_credits = (selectedUser.total_credits || 0) + addCredits;
        }
        if (addBalance !== 0) {
           updates.balance = (selectedUser.balance || 0) + addBalance;
        }
        await updateDoc(doc(db, 'users', selectedUser.id), updates);
        
        await logAction(`Updated user (balance: ${addBalance}, credits: ${addCredits}, plan: ${planId})`, selectedUser.email || selectedUser.id);
        
        setSelectedUser({ ...selectedUser, ...updates });
        setAddCredits(0);
        setAddBalance(0);
        onShowToast("User updated successfully");
     } catch (err: any) {
        onShowToast("Error: " + err.message);
     }
  };

  const handleSuspend = async () => {
    if (!selectedUser) return;
    const isSuspended = selectedUser.status === 'suspended';
    try {
        await updateDoc(doc(db, 'users', selectedUser.id), { status: isSuspended ? 'active' : 'suspended' });
        await logAction(isSuspended ? 'Unsuspended user' : 'Suspended user', selectedUser.email || selectedUser.id);
        setSelectedUser({ ...selectedUser, status: isSuspended ? 'active' : 'suspended' });
        onShowToast("User status updated");
    } catch (err: any) {
        onShowToast("Error: " + err.message);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">User Management</h2>
      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
         <form onSubmit={handleSearch} className="flex gap-4 mb-6">
           <div className="relative flex-1">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
             <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by email or User ID..." className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[#1497F3] text-white" />
           </div>
           <button type="submit" disabled={loading} className="px-6 py-3 bg-[#1497F3] hover:bg-[#2081C3] text-white font-bold rounded-xl transition-colors disabled:opacity-50">
             {loading ? 'Searching...' : 'Search'}
           </button>
         </form>

         {selectedUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/10 pt-6">
               <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#1497F3]">User Details</h3>
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-2 text-sm">
                     <p><span className="text-white/50">ID:</span> {selectedUser.id}</p>
                     <p><span className="text-white/50">Email:</span> {selectedUser.email || 'N/A'}</p>
                     <p><span className="text-white/50">Balance:</span> <span className="font-bold text-green-400">{selectedUser.balance || 0} UZS</span></p>
                     <p><span className="text-white/50">Plan:</span> <span className="uppercase text-[#1497F3] font-bold">{selectedUser.plan_id || 'free'}</span></p>
                     <p><span className="text-white/50">Credits Total:</span> {selectedUser.total_credits || 0}</p>
                     <p><span className="text-white/50">Credits Used:</span> {selectedUser.used_credits || 0}</p>
                     <p><span className="text-white/50">Available:</span> {Math.max((selectedUser.total_credits || 0) - (selectedUser.used_credits || 0), 0)}</p>
                     <p><span className="text-white/50">Status:</span> 
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${selectedUser.status === 'suspended' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                           {(selectedUser.status || 'Active').toUpperCase()}
                        </span>
                     </p>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#1497F3]">Quick Actions</h3>
                  
                  <div className="space-y-3">
                     <div>
                        <label className="block text-xs uppercase text-white/50 mb-1">Change Plan</label>
                        <select value={planId} onChange={e => setPlanId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 focus:border-[#1497F3] outline-none">
                           <option value="free">Free</option>
                           <option value="starter">Starter</option>
                           <option value="pro">Pro</option>
                           <option value="team">Team</option>
                           <option value="agency">Agency</option>
                        </select>
                     </div>

                     <div>
                        <label className="block text-xs uppercase text-white/50 mb-1">Add Balance (negative to deduct)</label>
                        <input type="number" value={addBalance} onChange={e => setAddBalance(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 focus:border-[#1497F3] outline-none" placeholder="0" />
                     </div>

                     <div>
                        <label className="block text-xs uppercase text-white/50 mb-1">Add Credits (negative to remove)</label>
                        <input type="number" value={addCredits} onChange={e => setAddCredits(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 focus:border-[#1497F3] outline-none" />
                     </div>

                     <div className="pt-2 flex gap-3">
                        <button onClick={handleUpdateUser} className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                           <CreditCard size={16} /> Update Details
                        </button>
                        <button onClick={handleSuspend} className={`flex-1 ${selectedUser.status === 'suspended' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'} font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors`}>
                           {selectedUser.status === 'suspended' ? <UserCheck size={16} /> : <UserX size={16} />}
                           {selectedUser.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
    </div>
  );
}
