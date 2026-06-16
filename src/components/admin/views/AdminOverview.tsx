import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { 
  Users, DollarSign, Activity, Zap, CreditCard, AlertCircle, RefreshCw, 
  ArrowRight, ShieldCheck, Database, Server, BrainCircuit, HardDrive, 
  Check, X, Image as ImageIcon, Bell, FileText, Gift, Box, HeartPulse
} from 'lucide-react';

interface AdminOverviewProps {
  onShowToast: (msg: string) => void;
  navigateTo?: (tabId: string) => void;
}

export default function AdminOverview({ onShowToast, navigateTo }: AdminOverviewProps) {
  const [stats, setStats] = useState({
    totalUsers: 0, activeToday: 0, newToday: 0,
    revenueMonth: 0, pendingPayments: 0, creditsConsumedToday: 0
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [latestUsers, setLatestUsers] = useState<any[]>([]);
  const [pendingPaymentsList, setPendingPaymentsList] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Modals state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  useEffect(() => {
    fetchDashboardData();
    logDashboardVisit();

    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const logDashboardVisit = async () => {
    try {
      await setDoc(doc(collection(db, 'audit_logs')), {
        admin: 'System Admin',
        action: 'Dashboard Visited',
        target: 'Admin Dashboard',
        timestamp: serverTimestamp()
      });
    } catch(e) {}
  };

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Parallel fetches for speed
      const [usersSnap, paymentsSnap, auditSnap, usageSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), orderBy('created_at', 'desc'), limit(50))),
        getDocs(query(collection(db, 'payments'), orderBy('created_at', 'desc'), limit(50))),
        getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(20))),
        getDocs(query(collection(db, 'usage_logs'), orderBy('timestamp', 'desc'), limit(100)))
      ]);

      let totalU = 0, newU = 0, activeU = 0;
      let revMonth = 0, pending = 0, creditsToday = 0;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      const usersList: any[] = [];
      usersSnap.forEach(d => {
        totalU++;
        const data = d.data();
        usersList.push({ id: d.id, ...data });

        const createdMs = data.created_at?.toMillis ? data.created_at.toMillis() : (data.created_at || 0);
        const loginMs = data.last_login?.toMillis ? data.last_login.toMillis() : (data.last_login || 0);

        if (createdMs >= todayStart) newU++;
        if (loginMs >= todayStart) activeU++;
      });

      const pendingList: any[] = [];
      paymentsSnap.forEach(d => {
        const data = d.data();
        const createdMs = data.created_at?.toMillis ? data.created_at.toMillis() : (data.created_at || Date.now());

        if (data.status === 'pending') {
          pending++;
          pendingList.push({ id: d.id, ...data });
        }
        if (data.status === 'approved' && createdMs >= monthStart) {
          revMonth += Number(data.amount) || 0;
        }
      });

      const activities: any[] = [];
      auditSnap.forEach(d => {
        const data = d.data();
        activities.push({ id: d.id, ...data });
      });

      usageSnap.forEach(d => {
        const data = d.data();
        const timeMs = data.timestamp?.toMillis ? data.timestamp.toMillis() : (data.timestamp || 0);
        if (timeMs >= todayStart) {
           creditsToday += (Number(data.credits_consumed) || 0);
        }
      });

      setStats({
        totalUsers: totalU,
        activeToday: activeU,
        newToday: newU,
        revenueMonth: revMonth,
        pendingPayments: pending,
        creditsConsumedToday: creditsToday
      });

      setLatestUsers(usersList.slice(0, 5));
      setPendingPaymentsList(pendingList.slice(0, 5));
      setRecentActivity(activities.slice(0, 8));
      
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      if (!silent) onShowToast("Failed to load dashboard data: " + err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAction = async (actionDesc: string) => {
    try {
      await setDoc(doc(collection(db, 'audit_logs')), {
        admin: 'System Admin',
        action: actionDesc,
        target: 'Quick Action',
        timestamp: serverTimestamp()
      });
      onShowToast(`Action successful: ${actionDesc}`);
      setActiveModal(null);
      fetchDashboardData(true);
    } catch(e: any) {
      onShowToast("Error: " + e.message);
    }
  };

  const handlePaymentAction = async (id: string, newStatus: string, userId?: string, amountStr?: string) => {
    try {
      await updateDoc(doc(db, 'payments', id), { status: newStatus });
      if (newStatus === 'approved' && userId && amountStr) {
         const userSnap = await getDoc(doc(db, 'users', userId));
         if (userSnap.exists()) {
            const currentBalance = userSnap.data().balance || 0;
            await updateDoc(doc(db, 'users', userId), { balance: currentBalance + Number(amountStr) });
         }
      }
      handleAction(`Marked payment ${id.slice(0,6)} as ${newStatus}`);
    } catch(e: any) { onShowToast("Error: " + e.message); }
  };

  // --- MOCK MODALS COMPONENT ---
  const ActionModal = () => {
    if (!activeModal) return null;
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-[#0A1322] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
          <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20}/></button>
          <h3 className="text-xl font-bold mb-6 capitalize">{activeModal.replace(/-/g, ' ')}</h3>
          
          <div className="space-y-4">
            {activeModal === 'create-promo-banner' && (
              <>
                <input type="text" placeholder="Title" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1497F3]" />
                <input type="text" placeholder="Promo Code" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1497F3]" />
              </>
            )}
            {activeModal === 'add-credits' && (
              <>
                <input type="text" placeholder="User Email or ID" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1497F3]" />
                <input type="number" placeholder="Credits Amount" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1497F3]" />
              </>
            )}
            {activeModal === 'create-coupon' && (
              <>
                <input type="text" placeholder="Coupon Code (e.g. SALE50)" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1497F3]" />
                <input type="number" placeholder="Discount %" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1497F3]" />
              </>
            )}
            {activeModal === 'create-notification' && (
              <>
                <input type="text" placeholder="Title" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1497F3]" />
                <textarea placeholder="Message" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1497F3] h-24"></textarea>
              </>
            )}
            {activeModal === 'create-pricing-plan' && (
              <>
                <input type="text" placeholder="Plan Name" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1497F3]" />
                <input type="number" placeholder="Price (UZS)" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1497F3]" />
              </>
            )}
            <button onClick={() => handleAction(`Executed ${activeModal}`)} className="w-full py-3 bg-[#1497F3] hover:bg-[#2081C3] text-white rounded-xl font-bold transition-colors mt-2">
              Save Action
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center flex-col text-white/50 space-y-4">
         <RefreshCw size={32} className="animate-spin text-[#1497F3]" />
         <p>Loading Platform Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <ActionModal />

      <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
         <div className="flex items-center gap-3">
            <HeartPulse size={24} className="text-green-400" />
            <div>
               <h2 className="font-bold text-lg leading-tight">Savdolab Real-Time Health</h2>
               <p className="text-xs text-white/50 flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 All systems operational
               </p>
            </div>
         </div>
         <div className="flex items-center gap-4 text-sm">
            <span className="text-white/40">Last synced: {lastRefreshed.toLocaleTimeString()}</span>
            <button onClick={() => fetchDashboardData()} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 transition-colors">
               <RefreshCw size={16} />
            </button>
         </div>
      </div>
      
      {/* 1. TOP KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
         <div onClick={() => navigateTo && navigateTo('users')} className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 hover:border-[#1497F3]/50 transition-all group">
            <div className="text-white/50 text-xs font-semibold uppercase mb-2 flex justify-between">Total Users <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
            <div className="text-2xl font-black text-white">{stats.totalUsers.toLocaleString()}</div>
         </div>
         <div onClick={() => navigateTo && navigateTo('users')} className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-[#1497F3]/10 hover:border-[#1497F3]/50 transition-all group relative overflow-hidden">
            <div className="text-[#1497F3] text-xs font-semibold uppercase mb-2">Active Today</div>
            <div className="text-2xl font-black text-white">{stats.activeToday.toLocaleString()}</div>
            <Activity className="absolute right-[-10px] bottom-[-10px] text-[#1497F3]/20" size={60} />
         </div>
         <div onClick={() => navigateTo && navigateTo('users')} className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-green-500/10 hover:border-green-500/50 transition-all group">
            <div className="text-green-400 text-xs font-semibold uppercase mb-2 flex justify-between">New Today <Users size={12} /></div>
            <div className="text-2xl font-black text-white">{stats.newToday}</div>
         </div>
         <div onClick={() => navigateTo && navigateTo('payments')} className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-purple-500/10 hover:border-purple-500/50 transition-all group">
            <div className="text-purple-400 text-xs font-semibold uppercase mb-2">Revenue Month</div>
            <div className="text-xl font-black text-white">{(stats.revenueMonth / 1000).toFixed(0)}k UZS</div>
         </div>
         <div onClick={() => navigateTo && navigateTo('payments')} className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-orange-500/10 hover:border-orange-500/50 transition-all group">
            <div className="text-orange-400 text-xs font-semibold uppercase mb-2">Pending Payments</div>
            <div className="text-2xl font-black text-white">{stats.pendingPayments}</div>
         </div>
         <div onClick={() => navigateTo && navigateTo('credits')} className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all group">
            <div className="text-emerald-400 text-xs font-semibold uppercase mb-2 flex justify-between">Credits Consumed</div >
            <div className="text-2xl font-black text-white flex gap-1 items-baseline">{stats.creditsConsumedToday.toLocaleString()} <span className="text-[10px] text-white/50">today</span></div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
         {/* LEFT COLUMN: Activity & Quick Actions */}
         <div className="xl:col-span-1 space-y-6">
            
            {/* Quick Actions Panel */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
               <h3 className="font-bold text-sm tracking-wide uppercase text-white/70 mb-4">Quick Actions</h3>
               <div className="space-y-2">
                  <button onClick={() => setActiveModal('create-promo-banner')} className="w-full flex items-center justify-between p-3 bg-black/40 hover:bg-[#1497F3] hover:border-[#1497F3] border border-white/5 rounded-lg text-sm font-medium transition-all group">
                     <span className="flex items-center gap-2"><ImageIcon size={16} className="text-white/50 group-hover:text-white" /> Create Promo Banner</span>
                  </button>
                  <button onClick={() => setActiveModal('add-credits')} className="w-full flex items-center justify-between p-3 bg-black/40 hover:bg-green-500 hover:border-green-500 border border-white/5 rounded-lg text-sm font-medium transition-all group">
                     <span className="flex items-center gap-2"><Zap size={16} className="text-white/50 group-hover:text-white" /> Add Credits</span>
                  </button>
                  <button onClick={() => setActiveModal('create-coupon')} className="w-full flex items-center justify-between p-3 bg-black/40 hover:bg-purple-500 hover:border-purple-500 border border-white/5 rounded-lg text-sm font-medium transition-all group">
                     <span className="flex items-center gap-2"><Gift size={16} className="text-white/50 group-hover:text-white" /> Create Coupon</span>
                  </button>
                  <button onClick={() => setActiveModal('create-notification')} className="w-full flex items-center justify-between p-3 bg-black/40 hover:bg-orange-500 hover:border-orange-500 border border-white/5 rounded-lg text-sm font-medium transition-all group">
                     <span className="flex items-center gap-2"><Bell size={16} className="text-white/50 group-hover:text-white" /> Send Notification</span>
                  </button>
                  <button onClick={() => setActiveModal('create-pricing-plan')} className="w-full flex items-center justify-between p-3 bg-black/40 hover:bg-indigo-500 hover:border-indigo-500 border border-white/5 rounded-lg text-sm font-medium transition-all group">
                     <span className="flex items-center gap-2"><Box size={16} className="text-white/50 group-hover:text-white" /> Add Pricing Plan</span>
                  </button>
               </div>
            </div>
         </div>

         {/* CENTER COLUMN: Tables & Feeds */}
         <div className="xl:col-span-3 space-y-6">
            
            {/* Split layout for Payments and Alert Center */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
               {/* Pending Payments Widget */}
               <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                     <h3 className="font-bold text-sm tracking-wide uppercase text-white/70">Pending Payments</h3>
                     <button onClick={() => navigateTo && navigateTo('payments')} className="text-xs text-[#1497F3] hover:underline">View All</button>
                  </div>
                  <div className="flex-1 p-0 overflow-x-auto">
                     <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-black/30 text-white/40">
                           <tr>
                              <th className="px-4 py-2 font-medium">User</th>
                              <th className="px-4 py-2 font-medium">Amount</th>
                              <th className="px-4 py-2 font-medium">Method</th>
                              <th className="px-4 py-2 font-medium">Created Date</th>
                              <th className="px-4 py-2 text-right font-medium">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {pendingPaymentsList.length === 0 ? (
                              <tr><td colSpan={5} className="px-4 py-6 text-center text-white/40">No pending payments.</td></tr>
                           ) : pendingPaymentsList.map(p => (
                              <tr key={p.id} className="hover:bg-white/5">
                                 <td className="px-4 py-3 text-white/70 truncate max-w-[120px]">{p.user_email || p.user_id}</td>
                                 <td className="px-4 py-3 font-mono font-bold text-orange-400">{p.amount}</td>
                                 <td className="px-4 py-3 text-white/60 text-xs uppercase">{p.provider || 'CLICK'}</td>
                                 <td className="px-4 py-3 text-white/40 text-[10px]">{p.created_at?.toDate ? p.created_at.toDate().toLocaleString() : 'N/A'}</td>
                                 <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                       <button onClick={() => navigateTo && navigateTo('payments')} className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded text-[10px] font-bold uppercase transition-colors">View</button>
                                       <button onClick={() => handlePaymentAction(p.id, 'approved', p.user_id, p.amount)} className="p-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded"><Check size={14}/></button>
                                       <button onClick={() => handlePaymentAction(p.id, 'rejected', p.user_id, p.amount)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded"><X size={14}/></button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

               {/* Recent Activity Feed */}
               <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                     <h3 className="font-bold text-sm tracking-wide uppercase text-white/70">Live Activity Feed</h3>
                     <button onClick={() => navigateTo && navigateTo('audit')} className="text-xs text-[#1497F3] hover:underline">Full Log</button>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar max-h-[250px] space-y-3">
                     {recentActivity.length > 0 ? recentActivity.map(act => (
                        <div key={act.id} className="flex gap-3 items-start cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors border border-transparent hover:border-white/5">
                           <div className="w-2 h-2 rounded-full bg-[#1497F3] mt-1.5 shrink-0"></div>
                           <div>
                              <p className="text-xs text-white/80 font-medium">{act.action}</p>
                              <p className="text-[10px] text-white/40 mt-0.5">
                                 Target: {act.target}  •  {act.timestamp?.toDate ? act.timestamp.toDate().toLocaleTimeString() : 'Just now'}
                              </p>
                           </div>
                        </div>
                     )) : (
                        <div className="text-center text-white/40 py-4 text-xs">No recent activity</div>
                     )}
                  </div>
               </div>

            </div>

            {/* Latest Users Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
               <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                  <h3 className="font-bold text-sm tracking-wide uppercase text-white/70">Latest Registered Users</h3>
                  <button onClick={() => navigateTo && navigateTo('users')} className="text-xs text-[#1497F3] hover:underline">Manage All</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                     <thead className="bg-black/30 text-white/40 text-xs">
                        <tr>
                           <th className="px-5 py-3 font-medium">Name</th>
                           <th className="px-5 py-3 font-medium">Email</th>
                           <th className="px-5 py-3 font-medium">Plan</th>
                           <th className="px-5 py-3 font-medium">Credits</th>
                           <th className="px-5 py-3 font-medium">Registration Date</th>
                           <th className="px-5 py-3 font-medium">Status</th>
                           <th className="px-5 py-3 font-medium text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {latestUsers.length === 0 ? (
                           <tr><td colSpan={7} className="px-5 py-8 text-center text-white/40">No users found.</td></tr>
                        ) : latestUsers.map(u => (
                           <tr key={u.id} className="hover:bg-white/2 transition-colors">
                              <td className="px-5 py-3 text-white/90 font-medium">
                                 {u.name || 'Unknown'}
                                 {u.is_admin && <span className="ml-2 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] uppercase rounded">Admin</span>}
                              </td>
                              <td className="px-5 py-3 text-white/70">
                                 {u.email || u.id.slice(0,10)+'...'}
                              </td>
                              <td className="px-5 py-3">
                                 <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-white/70">{u.plan_id || 'Free'}</span>
                              </td>
                              <td className="px-5 py-3 font-mono font-bold text-[#1497F3]">{(u.total_credits || 0) - (u.used_credits || 0)}</td>
                              <td className="px-5 py-3 text-white/40 text-xs">
                                 {u.created_at?.toDate ? u.created_at.toDate().toLocaleString() : 'N/A'}
                              </td>
                              <td className="px-5 py-3">
                                 <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/20 text-green-400">Active</span>
                              </td>
                              <td className="px-5 py-3 text-right">
                                 <div className="flex justify-end gap-2">
                                    <button onClick={() => navigateTo && navigateTo('users')} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors">View</button>
                                    <button onClick={() => { setActiveModal('add-credits'); }} className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 px-2 py-1 rounded transition-colors">Add Credits</button>
                                    <button onClick={() => handleAction(`Suspended user ${u.email || u.id}`)} className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-1 rounded transition-colors">Suspend</button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Empty space for Charts (Mocked visual placeholders) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white/5 border border-white/10 rounded-xl p-5 relative overflow-hidden h-48 flex flex-col justify-between group cursor-pointer">
                  <h3 className="font-bold text-sm tracking-wide uppercase text-white/70 relative z-10">Revenue (30d Trend)</h3>
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1497F3]/20 to-transparent"></div>
                  <div className="relative z-10 flex items-end justify-between">
                     <p className="text-3xl font-black text-white">4.5M <span className="text-sm font-medium text-white/50">UZS</span></p>
                     <div className="text-green-400 text-xs font-bold">+12% vs last period</div>
                  </div>
               </div>
               
               <div className="bg-white/5 border border-white/10 rounded-xl p-5 relative overflow-hidden h-48 flex flex-col justify-between group cursor-pointer">
                  <h3 className="font-bold text-sm tracking-wide uppercase text-white/70 relative z-10">AI Feature Usage</h3>
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-purple-500/20 to-transparent"></div>
                  <div className="relative z-10 space-y-2">
                     <div className="flex justify-between text-xs"><span>Winning Product</span> <span className="font-bold">45%</span></div>
                     <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden"><div className="bg-purple-500 h-full w-[45%]"></div></div>
                     
                     <div className="flex justify-between text-xs pt-1"><span>Ad Analyzer</span> <span className="font-bold">30%</span></div>
                     <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden"><div className="bg-pink-500 h-full w-[30%]"></div></div>
                  </div>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}
