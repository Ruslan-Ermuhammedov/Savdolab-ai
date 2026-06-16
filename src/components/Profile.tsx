import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth, logOut, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { updateProfile, updatePassword } from 'firebase/auth';
import { Save, User, Briefcase, CreditCard, Bookmark, Shield, Settings, LogOut, Check, FileText, Activity, Wallet, Upload, ArrowRight } from 'lucide-react';
import AdminBanners from './AdminBanners';
import LandingManager from './LandingManager';

interface ProfileProps {
  user: any;
  onShowToast: (msg: string) => void;
  onNavigateToPricing?: () => void;
  initialTab?: string;
}

export default function Profile({ user, onShowToast, onNavigateToPricing, initialTab = 'personal' }: ProfileProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile Data
  const [userData, setUserData] = useState<any>({});
  
  // Form overrides
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [occupation, setOccupation] = useState('');
  const [storeName, setStoreName] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState('');
  const [mainGoals, setMainGoals] = useState<string[]>([]);
  
  // Credits
  const [totalCredits, setTotalCredits] = useState(0);
  const [usedCredits, setUsedCredits] = useState(0);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  
  // Billing / Payment Requests
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentFullName, setPaymentFullName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentComment, setPaymentComment] = useState('');
  const [paymentScreenshotBase64, setPaymentScreenshotBase64] = useState('');
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState<any>({});
  
  const [newPassword, setNewPassword] = useState('');
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      setFullName(user.displayName || '');
      setPhoneNumber(user.phoneNumber || '');
      
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setOccupation(data.occupation || '');
          setStoreName(data.store_name || '');
          setPlatforms(data.platforms || []);
          setTeamSize(data.team_size || '');
          setMainGoals(data.main_goals || []);
          setTotalCredits(data.total_credits || 0);
          setUsedCredits(data.used_credits || 0);
          if (data.phone_number && !user.phoneNumber) {
             setPhoneNumber(data.phone_number);
          }
        }
        
        // Fetch logs
        const logsRef = collection(db, 'usage_logs');
        const q = query(logsRef, where('userId', '==', user.uid));
        const logsSnap = await getDocs(q);
        const logsData = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        logsData.sort((a: any, b: any) => b.timestamp - a.timestamp);
        setUsageLogs(logsData.slice(0, 20));
        // Fetch app settings
        const settingsDoc = await getDoc(doc(db, 'app_settings', 'general'));
        if (settingsDoc.exists()) setAppSettings(settingsDoc.data());

        // Fetch payments
        const paymentsRef = collection(db, 'payments');
        const pq = query(paymentsRef, where('user_id', '==', user.uid));
        const pSnap = await getDocs(pq);
        const pData = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        pData.sort((a: any, b: any) => {
           const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : a.created_at;
           const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : b.created_at;
           return timeB - timeA;
        });
        setPaymentRequests(pData);
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handleSavePersonal = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName: fullName });
      await updateDoc(doc(db, 'users', user.uid), {
        phone_number: phoneNumber,
        updatedAt: Date.now()
      });
      onShowToast("Profil muvaffaqiyatli saqlandi");
    } catch (error) {
      console.error(error);
      onShowToast("Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        occupation,
        store_name: storeName,
        platforms,
        team_size: teamSize,
        main_goals: mainGoals,
        updatedAt: Date.now()
      });
      onShowToast("Biznes ma'lumotlari saqlandi");
    } catch (error) {
      console.error(error);
      onShowToast("Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !newPassword) return;
    try {
      await updatePassword(user, newPassword);
      onShowToast("Parol muvaffaqiyatli o'zgartirildi");
      setNewPassword('');
    } catch (error) {
      console.error(error);
      onShowToast("Xatolik. Qaytadan tizimga kiring.");
    }
  };

  const togglePlatform = (platform: string) => {
    setPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]);
  };

  const toggleGoal = (goal: string) => {
    setMainGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPaymentScreenshotBase64(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPayment = async () => {
    if (!paymentMethod || !paymentFullName || !paymentAmount || !paymentScreenshotBase64) {
       onShowToast("Iltimos, barcha majburiy maydonlarni to'ldiring");
       return;
    }
    
    setSaving(true);
    try {
      const newRef = doc(collection(db, 'payments'));
      const reqData = {
        user_id: user.uid,
        user_email: user.email,
        user_name: paymentFullName,
        amount: paymentAmount,
        method: paymentMethod,
        comment: paymentComment,
        screenshot_url: paymentScreenshotBase64,
        status: 'pending',
        created_at: new Date()
      };
      await setDoc(newRef, reqData);
      
      setPaymentRequests(prev => [{ id: newRef.id, ...reqData }, ...prev]);
      
      setPaymentMethod('');
      setPaymentFullName('');
      setPaymentAmount('');
      setPaymentComment('');
      setPaymentScreenshotBase64('');
      
      onShowToast("To'lov arizangiz qabul qilindi. 30 daqiqa ichida tekshiriladi");
    } catch(err) {
      console.error(err);
      onShowToast("Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Shaxsiy ma\'lumotlar', icon: <User size={18} /> },
    { id: 'business', label: 'Biznes profil', icon: <Briefcase size={18} /> },
    { id: 'credits', label: 'Kreditlar', icon: <CreditCard size={18} /> },
    { id: 'billing', label: 'To\'lovlar', icon: <Wallet size={18} /> },
    { id: 'saved', label: 'Saqlanganlar', icon: <Bookmark size={18} /> },
    { id: 'security', label: 'Xavfsizlik', icon: <Shield size={18} /> },
    { id: 'preferences', label: 'Sozlamalar', icon: <Settings size={18} /> },
  ];
  
  if (userData?.is_admin) {
    tabs.push({ id: 'admin', label: 'Admin Panel', icon: <Shield size={18} /> });
  }

  const [adminSearchEmail, setAdminSearchEmail] = useState('');
  const [adminFoundUser, setAdminFoundUser] = useState<any>(null);
  const [adminActionCredits, setAdminActionCredits] = useState(0);
  const [adminActionPlan, setAdminActionPlan] = useState('');
  
  const [adminView, setAdminView] = useState('users');
  const [adminPlans, setAdminPlans] = useState<any[]>([]);
  const [adminPayments, setAdminPayments] = useState<any[]>([]);
  const [adminPaymentsFilter, setAdminPaymentsFilter] = useState('all');
  const [adminPaymentsSearch, setAdminPaymentsSearch] = useState('');
  const [adminAppSettings, setAdminAppSettings] = useState({ humoCard: '', visaCard: '', humoHolder: '', visaHolder: '', supportLink: '' });
  const [adminSpinSettings, setAdminSpinSettings] = useState<any>({ enabled: true, rewards: [] });
  const [adminSpinHistory, setAdminSpinHistory] = useState<any[]>([]);

  const filteredAdminPayments = adminPayments.filter(p => {
      if (adminPaymentsFilter !== 'all' && p.status !== adminPaymentsFilter) return false;
      if (adminPaymentsSearch) {
          const s = adminPaymentsSearch.toLowerCase();
          const matchEmail = p.email?.toLowerCase().includes(s);
          const matchUser = p.userName?.toLowerCase().includes(s);
          const matchDate = new Date(p.createdAt).toLocaleDateString().includes(s);
          if (!matchEmail && !matchUser && !matchDate) return false;
      }
      return true;
  });

  useEffect(() => {
    if (userData?.is_admin && activeTab === 'admin') {
      const fetchDataForAdmin = async () => {
         const snap = await getDocs(collection(db, 'plans'));
         const pData: any[] = [];
         snap.forEach(d => pData.push({ id: d.id, ...d.data() }));
         setAdminPlans(pData);

         const pSnap = await getDocs(query(collection(db, 'payments'), orderBy('created_at', 'desc')));
         const pmData: any[] = [];
         pSnap.forEach(d => pmData.push({ id: d.id, ...d.data() }));
         setAdminPayments(pmData);

         const asSnap = await getDoc(doc(db, 'app_settings', 'general'));
         if (asSnap.exists()) setAdminAppSettings(asSnap.data() as any);

         const swSnap = await getDoc(doc(db, 'app_settings', 'spin_wheel'));
         if (swSnap.exists()) setAdminSpinSettings(swSnap.data());

         const hSnap = await getDocs(query(collection(db, 'spin_history'), orderBy('createdAt', 'desc')));
         const hData: any[] = [];
         hSnap.forEach(d => hData.push({ id: d.id, ...d.data() }));
         setAdminSpinHistory(hData);
      };
      fetchDataForAdmin();
    }
  }, [userData?.is_admin, activeTab]);

  const handleSaveSpinSettings = async () => {
      try {
          await setDoc(doc(db, 'app_settings', 'spin_wheel'), adminSpinSettings, { merge: true });
          onShowToast("Spin Wheel saqlandi");
      } catch (e) {
          console.error(e);
          onShowToast("Xatolik");
      }
  };

  const handleSaveAppSettings = async () => {
      try {
          await setDoc(doc(db, 'app_settings', 'general'), adminAppSettings, { merge: true });
          onShowToast("Sozlamalar saqlandi");
      } catch (e) {
          console.error(e);
          onShowToast("Xatolik");
      }
  };

  const handleAdminPaymentAction = async (paymentId: string, action: 'approve' | 'reject', userId: string, amount: number, rejectReason: string = '') => {
      try {
          const status = action === 'approve' ? 'approved' : 'rejected';
          await updateDoc(doc(db, 'payments', paymentId), {
              status,
              rejectionReason: rejectReason,
              processedAt: Date.now(),
              processedBy: user.uid
          });

          if (action === 'approve') {
             // add balance
             const userDocRef = doc(db, 'users', userId);
             const userSnap = await getDoc(userDocRef);
             if (userSnap.exists()) {
                 const ud = userSnap.data();
                 const currentBalance = ud.balance || 0;
                 await updateDoc(userDocRef, { balance: currentBalance + parseInt(amount.toString()) });
             }
          }

          // log audit
          await setDoc(doc(collection(db, 'audit_logs')), {
              adminId: user.uid,
              action: action === 'approve' ? 'approve_payment' : 'reject_payment',
              userId,
              amount,
              paymentId,
              date: Date.now()
          });

          setAdminPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status, rejectionReason: rejectReason } : p));
          onShowToast(action === 'approve' ? "Tasdiqlandi" : "Rad etildi");
      } catch (e) {
          console.error(e);
          onShowToast("Xatolik");
      }
  };

  const handleAdminUpdatePlanSetting = async (planId: string, field: string, value: any) => {
    try {
       await updateDoc(doc(db, 'plans', planId), { [field]: value });
       setAdminPlans(prev => prev.map(p => p.id === planId ? { ...p, [field]: value } : p));
       onShowToast("Tarif yangilandi");
    } catch (e) {
       console.error(e);
       onShowToast("Xatolik");
    }
  };

  const handleSeedPlans = async () => {
    const p = [
      { id: 'free', name: 'FREE', price: 0, credits: 20, features: ['Winning Product Finder', 'Ad Analyzer'], notIncluded: ['Competitor Spy', 'Export Reports', 'Saved Reports', 'Priority Support'] },
      { id: 'starter', name: 'STARTER', price: 15, credits: 100, features: ['Winning Product Finder', 'Trend Hunter', 'Ad Analyzer', 'Saved Reports'], notIncluded: ['Competitor Spy', 'Export Reports', 'Priority Support'] },
      { id: 'pro', name: 'PRO', price: 49, credits: 300, features: ['Winning Product Finder', 'Trend Hunter', 'Competitor Spy', 'Ad Analyzer', 'Export Reports', 'Saved Reports'], notIncluded: ['Priority Support'] },
      { id: 'team', name: 'TEAM', price: 129, credits: 1000, features: ['Winning Product Finder', 'Trend Hunter', 'Competitor Spy', 'Ad Analyzer', 'Export Reports', 'Saved Reports', 'Team Members', 'Shared Reports', 'Priority Queue'], notIncluded: ['White Label Reports', 'Dedicated Support'] },
      { id: 'agency', name: 'AGENCY', price: 299, credits: 5000, features: ['Winning Product Finder', 'Trend Hunter', 'Competitor Spy', 'Ad Analyzer', 'Export Reports', 'Saved Reports', 'Unlimited Team Members', 'White Label Reports', 'Advanced Analytics', 'Dedicated Support'], notIncluded: [] }
    ];
    try {
      for (const plan of p) {
         await setDoc(doc(db, 'plans', plan.id), plan);
      }
      onShowToast("Tariflar muvaffaqiyatli yaratildi");
      setAdminPlans(p);
    } catch(e) { console.error(e); }
  };

  const handleAdminSearch = async () => {
    if (!adminSearchEmail) return;
    try {
      const usersRef = collection(db, 'users');
      const docRef = doc(db, 'users', adminSearchEmail);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
         setAdminFoundUser({ id: docSnap.id, ...docSnap.data() });
         setAdminActionPlan(docSnap.data().plan_id || 'free');
      } else {
         onShowToast("Foydalanuvchi topilmadi");
         setAdminFoundUser(null);
      }
    } catch (e) {
      console.error(e);
      onShowToast("Xatolik");
    }
  };

  const handleAdminUpdateCredits = async (action: 'add' | 'remove' | 'reset') => {
    if (!adminFoundUser) return;
    try {
      let newTotal = adminFoundUser.total_credits || 0;
      let newUsed = adminFoundUser.used_credits || 0;
      
      if (action === 'add') newTotal += Number(adminActionCredits);
      if (action === 'remove') newTotal = Math.max(0, newTotal - Number(adminActionCredits));
      if (action === 'reset') {
         newTotal = Number(adminActionCredits) || 50;
         newUsed = 0;
      }
      
      await updateDoc(doc(db, 'users', adminFoundUser.id), {
        total_credits: newTotal,
        used_credits: newUsed,
        updatedAt: Date.now()
      });
      onShowToast(`Kreditlar yangilandi. Yangi balans: ${newTotal - newUsed}`);
      setAdminFoundUser({ ...adminFoundUser, total_credits: newTotal, used_credits: newUsed});
    } catch (e) {
      console.error(e);
      onShowToast("Xatolik yuz berdi");
    }
  };

  const handleAdminUpdatePlan = async () => {
    if (!adminFoundUser) return;
    try {
      await updateDoc(doc(db, 'users', adminFoundUser.id), {
        plan_id: adminActionPlan,
        updatedAt: Date.now()
      });
      onShowToast("Foydalanuvchi tarifi yangilandi");
      setAdminFoundUser({ ...adminFoundUser, plan_id: adminActionPlan });
    } catch (e) {
      console.error(e);
       onShowToast("Xatolik yuz berdi");
    }
  };

  if (loading) {
     return <div className="flex-1 flex items-center justify-center bg-[#000000] text-white">Loading...</div>;
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#000000] text-white overflow-hidden relative">
      {/* Profile Sidebar */}
      <div className="w-full md:w-64 bg-[#0A0D12]/50 border-r border-white/5 flex flex-col pt-8 px-4 overflow-y-auto z-10 md:h-full shrink-0 max-h-64 md:max-h-none border-b md:border-b-0">
        <h2 className="text-xl font-bold mb-6 px-2">Sozlamalar</h2>
        <div className="flex flex-row md:flex-col gap-1 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap md:whitespace-normal flex-shrink-0 md:flex-shrink ${activeTab === tab.id ? 'bg-[#1497F3]/10 text-[#1497F3] font-medium' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
            >
              <div className={activeTab === tab.id ? 'text-[#1497F3]' : 'opacity-70'}>{tab.icon}</div>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 z-10">
        <div className="max-w-2xl mx-auto pb-20">
          
          {/* PERSONAL TAB */}
          {activeTab === 'personal' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-1">Shaxsiy ma'lumotlar</h3>
                <p className="text-white/50 text-sm">O'zingiz haqingizdagi asosiy ma'lumotlar</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-[#1497F3] flex items-center justify-center overflow-hidden border-2 border-white/10 shadow-lg text-2xl font-bold">
                    {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : user?.displayName?.[0] || 'U'}
                  </div>
                  <div>
                     <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors border border-white/5">Suratni o'zgartirish</button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">F.I.Sh</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1497F3] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Email (O'zgartirib bo'lmaydi)</label>
                    <input type="email" value={user?.email || ''} disabled className="w-full bg-white/5 border border-white/5 opacity-70 rounded-xl px-4 py-3" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Telefon raqam</label>
                    <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+998 90 123 45 67" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1497F3] transition-colors" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSavePersonal} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-[#1497F3] hover:bg-[#1497F3]/90 text-white rounded-xl font-medium transition-colors shadow-[0_0_20px_rgba(20,151,243,0.3)]">
                  <Save size={18} />
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </motion.div>
          )}

          {/* BUSINESS TAB */}
          {activeTab === 'business' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-1">Biznes profil</h3>
                <p className="text-white/50 text-sm">Savdo ma'lumotlaringiz</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Soha</label>
                  <select value={occupation} onChange={e => setOccupation(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1497F3] transition-colors appearance-none">
                    <option value="">Tanlang</option>
                    <option value="Marketplace seller">Marketplace seller</option>
                    <option value="Dropshipper">Dropshipper</option>
                    <option value="Store owner">Store owner</option>
                    <option value="Marketing agency">Marketing agency</option>
                    <option value="Beginner entrepreneur">Beginner entrepreneur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Do'kon nomi</label>
                  <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Do'koningiz bormi?" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1497F3] transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Ishchilar soni</label>
                  <select value={teamSize} onChange={e => setTeamSize(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1497F3] transition-colors appearance-none">
                    <option value="">Tanlang</option>
                    <option value="Faqat men">Faqat men</option>
                    <option value="2-5">2-5 ishchi</option>
                    <option value="6-10">6-10 ishchi</option>
                    <option value="11-50">11-50 ishchi</option>
                    <option value="50+">50+ ishchi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Sotuv platformalari</label>
                  <div className="flex flex-wrap gap-2">
                    {['Uzum', 'Yandex Market', 'Ozon', 'Wildberries', 'Shopify', 'TikTok Shop', 'Other'].map(opt => (
                      <button 
                        key={opt} 
                        onClick={() => togglePlatform(opt)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors border ${platforms.includes(opt) ? 'bg-[#1497F3]/20 border-[#1497F3] text-white' : 'bg-transparent border-white/10 text-white/60 hover:border-white/30'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Asosiy maqsadlar</label>
                  <div className="flex flex-wrap gap-2">
                     {['Winning products topish', 'Trendlarni kuzatish', 'Raqobatchilarni analiz qilish', 'Reklamalarni yaxshilash', 'Savdoni oshirish'].map(opt => (
                      <button 
                        key={opt} 
                        onClick={() => toggleGoal(opt)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors border ${mainGoals.includes(opt) ? 'bg-[#1497F3]/20 border-[#1497F3] text-white' : 'bg-transparent border-white/10 text-white/60 hover:border-white/30'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSaveBusiness} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-[#1497F3] hover:bg-[#1497F3]/90 text-white rounded-xl font-medium transition-colors shadow-[0_0_20px_rgba(20,151,243,0.3)]">
                  <Save size={18} />
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </motion.div>
          )}

          {/* CREDITS & PLAN TAB */}
          {activeTab === 'credits' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-1">Kreditlar va Obuna</h3>
                <p className="text-white/50 text-sm">Tarif va foydalanish statistikasi</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-500/20 to-transparent border border-green-500/30 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <Wallet size={64} />
                  </div>
                  <h4 className="text-green-400 text-sm font-semibold mb-1 uppercase tracking-widest">Joriy Balans</h4>
                  <div className="text-3xl font-bold mb-2">{userData?.balance || 0} <span className="text-sm font-normal text-white/50">UZS</span></div>
                  <p className="text-white/60 text-sm mb-6 mt-2">
                     Tarif sotib olish uchun mablag'
                  </p>
                  <button onClick={() => setActiveTab('billing')} className="w-full px-4 py-2.5 bg-white text-black hover:bg-gray-100 rounded-xl font-semibold transition-colors text-sm">
                    Balansni to'ldirish
                  </button>
                </div>

                <div className="bg-gradient-to-br from-[#1497F3]/20 to-transparent border border-[#1497F3]/30 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <CreditCard size={64} />
                  </div>
                  <h4 className="text-[#1497F3] text-sm font-semibold mb-1 uppercase tracking-widest">Joriy tarif</h4>
                  <div className="text-3xl font-bold mb-2">{(userData?.plan_id || 'free').toUpperCase()}</div>
                  <div className="text-sm font-medium mb-1 text-white/80 border border-white/10 px-2 py-1 inline-block rounded bg-black/20">
                     Amal qilish muddati: Cheksiz
                  </div>
                  <p className="text-white/60 text-sm mb-6 mt-2">
                     Asosiy tahlil vositalaridan foydalanish
                  </p>
                  <button onClick={() => onNavigateToPricing && onNavigateToPricing()} className="w-full px-4 py-2.5 bg-white text-black hover:bg-gray-100 rounded-xl font-semibold transition-colors text-sm">
                    Tarifni o'zgartirish
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="text-white/50 text-sm font-semibold mb-4 uppercase tracking-widest">Xarajatlar limitlari</h4>
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-2xl font-bold">{Math.max(totalCredits - usedCredits, 0)} <span className="text-white/40 text-sm font-normal">/ {totalCredits}</span></span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#1497F3] h-full transition-all duration-500" style={{ width: `${Math.min((usedCredits / Math.max(totalCredits, 1)) * 100, 100)}%` }}></div>
                    </div>
                    <p className="text-white/40 text-xs mt-2">Kredit ishlatingiz. Qolgan: {Math.max(totalCredits - usedCredits, 0)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2"><Activity size={16} className="text-[#1497F3]" /> Foydalanish tarixi</h4>
                {usageLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 bg-black/20 rounded-xl border border-white/5 border-dashed">
                     <p className="text-white/50 text-sm">Hali hech qanday funksiya ishlatilmadi.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {usageLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                        <div className="flex flex-col">
                           <span className="font-medium text-white/90 text-sm">{log.feature} xizmati ishladi</span>
                           <span className="text-xs text-white/40 mt-1">{new Date(log.timestamp).toLocaleString('uz-UZ')}</span>
                        </div>
                        <div className="text-red-400 font-bold text-sm">
                           -{log.credits_consumed} kredit
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 className="text-lg font-bold mb-4">Obuna</h4>
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                  <div className="mb-4 sm:mb-0">
                    <p className="font-medium text-white mb-1">PRO Tarifiga o'tish</p>
                    <p className="text-sm text-white/50">Cheklanmagan AI tahlillar va to'liq trend datchiklari</p>
                  </div>
                  <button onClick={() => onNavigateToPricing && onNavigateToPricing()} className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-[#1497F3] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity w-full sm:w-auto shadow-lg">
                    PRO'ga o'tish
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-1">To'lovlar</h3>
                <p className="text-white/50 text-sm">Balansni to'ldirish va to'lovlar tarixi</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <h4 className="text-lg font-bold mb-2">Balansni to'ldirish arizasi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">To'lov tizimini tanlang</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <button disabled className="opacity-50 cursor-not-allowed border border-white/10 bg-black/40 rounded-xl p-3 text-sm flex flex-col items-center">
                        <span className="font-bold mb-1">Click</span>
                        <span className="text-[10px] text-white/40 text-center leading-tight">Texnik ishlar olib borilmoqda</span>
                      </button>
                      <button disabled className="opacity-50 cursor-not-allowed border border-white/10 bg-black/40 rounded-xl p-3 text-sm flex flex-col items-center">
                        <span className="font-bold mb-1">Payme</span>
                        <span className="text-[10px] text-white/40 text-center leading-tight">Texnik ishlar olib borilmoqda</span>
                      </button>
                      <button disabled className="opacity-50 cursor-not-allowed border border-white/10 bg-black/40 rounded-xl p-3 text-sm flex flex-col items-center">
                        <span className="font-bold mb-1">Uzum Bank</span>
                        <span className="text-[10px] text-white/40 text-center leading-tight">Texnik ishlar olib borilmoqda</span>
                      </button>
                      
                      <button onClick={() => setPaymentMethod('Humo')} className={`border rounded-xl p-3 text-sm flex flex-col items-center justify-center transition-all ${paymentMethod === 'Humo' ? 'border-[#1497F3] bg-[#1497F3]/10' : 'border-white/10 bg-black/40 hover:bg-white/5'}`}>
                        <span className="font-bold">Humo</span>
                      </button>
                      <button onClick={() => setPaymentMethod('Visa')} className={`border rounded-xl p-3 text-sm flex flex-col items-center justify-center transition-all ${paymentMethod === 'Visa' ? 'border-[#1497F3] bg-[#1497F3]/10' : 'border-white/10 bg-black/40 hover:bg-white/5'}`}>
                        <span className="font-bold">Visa</span>
                      </button>
                    </div>
                  </div>
                </div>

                {paymentMethod && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 mt-4 pt-6 border-t border-white/10">
                    <div className="bg-[#1497F3]/10 border border-[#1497F3]/30 p-4 rounded-xl">
                      <p className="text-sm text-white/80 mb-2">Quyidagi hisob raqamiga to'lovni amalga oshiring:</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-white/50">Karta raqami:</span>
                           <span className="font-bold text-[#1497F3]">{paymentMethod === 'Humo' ? appSettings?.humoCard : appSettings?.visaCard }</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-white/50">F.I.Sh:</span>
                           <span className="font-bold text-white/90">{paymentMethod === 'Humo' ? appSettings?.humoHolder : appSettings?.visaHolder }</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-white/50">Bank:</span>
                           <span className="font-bold text-white/90">{paymentMethod === 'Humo' ? 'Humo' : 'Visa'} Bank</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">F.I.Sh</label>
                        <input type="text" value={paymentFullName} onChange={e => setPaymentFullName(e.target.value)} placeholder="Kartadagi Ism Familiya" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1497F3]" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">To'lov miqdori (so'm/$)</label>
                        <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1497F3]" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Sharh (Ixtiyoriy)</label>
                      <textarea value={paymentComment} onChange={e => setPaymentComment(e.target.value)} placeholder="Qo'shimcha ma'lumotlar..." className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 min-h-[80px] focus:outline-none focus:border-[#1497F3]" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">To'lov skrinshoti (Majburiy)</label>
                      <div className="relative border-2 border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center bg-black/30 hover:bg-white/5 hover:border-white/30 transition-all cursor-pointer overflow-hidden">
                         <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                         {paymentScreenshotBase64 ? (
                           <div className="flex flex-col items-center pointer-events-none">
                             <Check size={32} className="text-green-500 mb-2" />
                             <span className="text-sm font-medium text-white">Rasm yuklandi</span>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center pointer-events-none">
                             <Upload size={32} className="text-white/40 mb-2" />
                             <span className="text-sm font-medium text-white/80">Skrinshotni yuklash uchun bosing</span>
                           </div>
                         )}
                      </div>
                    </div>

                    <button onClick={handleSubmitPayment} disabled={saving} className="w-full py-3.5 bg-[#1497F3] hover:bg-[#1497F3]/90 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2">
                      {saving ? 'Yuborilmoqda...' : 'Arizani yuborish'} <ArrowRight size={18} />
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                 <h4 className="font-semibold text-white mb-4">To'lovlar tarixi</h4>
                 {paymentRequests.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-10 bg-black/20 rounded-xl border border-white/5 border-dashed">
                      <p className="text-white/50 text-sm">Hali hech qanday ariza mavjud emas.</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {paymentRequests.map((req) => (
                       <div key={req.id} className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5 flex-col md:flex-row gap-3">
                         <div className="flex flex-col flex-1 w-full">
                            <span className="font-medium text-white/90 text-sm">{req.amount} - {req.method}</span>
                             <span className="text-xs text-white/40 mt-1">{req.created_at?.toDate ? req.created_at.toDate().toLocaleString('uz-UZ') : new Date(req.created_at).toLocaleString('uz-UZ')}</span>
                         </div>
                         <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                            {req.status === 'pending' && <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2.5 py-1 rounded-md font-semibold border border-yellow-500/30">Kutilmoqda</span>}
                            {req.status === 'approved' && <span className="bg-green-500/20 text-green-400 text-xs px-2.5 py-1 rounded-md font-semibold border border-green-500/30">Tasdiqlandi</span>}
                            {req.status === 'rejected' && <span className="bg-red-500/20 text-red-400 text-xs px-2.5 py-1 rounded-md font-semibold border border-red-500/30">Rad etildi</span>}
                            
                            {req.status === 'pending' && appSettings?.supportLink && (
                              <a href={appSettings.supportLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1497F3] border border-[#1497F3]/30 px-3 py-1 rounded-md hover:bg-[#1497F3]/10">
                                Support
                              </a>
                            )}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </motion.div>
          )}

          {/* SAVED ITEMS & PROMPTS TAB */}
          {activeTab === 'saved' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-1">Saqlangan tahlillar va So'rovlar</h3>
                <p className="text-white/50 text-sm">O'zingiz saqlab qo'ygan natijalar</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                 <h4 className="font-semibold text-white mb-4 flex items-center gap-2"><FileText size={16} className="text-[#1497F3]"/> Tahlil hisobotlari</h4>
                 
                 <div className="flex flex-col items-center justify-center py-10 bg-black/20 rounded-xl border border-white/5 border-dashed">
                   <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/30 mb-3">
                     <Bookmark size={20} />
                   </div>
                   <p className="text-white/50 text-sm">Sizda hozircha saqlangan tahlillar yo'q.</p>
                 </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                 <h4 className="font-semibold text-white mb-4 flex items-center gap-2"><Bookmark size={16} className="text-[#1497F3]"/> Saqlangan promptlar</h4>
                 <div className="flex flex-col items-center justify-center py-10 bg-black/20 rounded-xl border border-white/5 border-dashed">
                   <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/30 mb-3">
                     <Bookmark size={20} />
                   </div>
                   <p className="text-white/50 text-sm">Saqlangan promptlar mavjud emas.</p>
                 </div>
              </div>
            </motion.div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-1">Xavfsizlik</h3>
                <p className="text-white/50 text-sm">Hisob xavfsizligi va parollar</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <h4 className="font-medium">Parolni o'zgartirish</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Yangi parol</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Yangi parolni kiriting" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1497F3] transition-colors" />
                  </div>
                </div>
                <div className="pt-2">
                  <button onClick={handleChangePassword} disabled={!newPassword || newPassword.length < 6} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/5 disabled:opacity-50">
                    Parolni yangilash
                  </button>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                <h4 className="font-medium text-red-400 mb-2">Barcha qurilmalardan chiqish</h4>
                <p className="text-white/50 text-sm mb-6">Xavfsizligingizni oshirish uchun barcha qurilmalardagi seanslarni yopish.</p>
                <button onClick={() => { logOut(); }} className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-medium transition-colors">
                  <LogOut size={16} />
                  Tizimdan chiqish
                </button>
              </div>
            </motion.div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-1">Sozlamalar</h3>
                <p className="text-white/50 text-sm">Til va bildirishnomalar</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Interfeys tili</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button className="px-4 py-3 bg-[#1497F3]/10 border border-[#1497F3] rounded-xl text-center text-[#1497F3] font-medium flex justify-center items-center gap-2">
                      <Check size={16} /> O'zbekcha
                    </button>
                    <button className="px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-center text-white/50 hover:bg-white/5 transition-colors">
                      Русский
                    </button>
                    <button className="px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-center text-white/50 hover:bg-white/5 transition-colors">
                      English
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h4 className="font-medium mb-4">Bildirishnomalar</h4>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-xl cursor-pointer">
                      <div>
                        <div className="font-medium text-white/90">Email xabarlar</div>
                        <div className="text-xs text-white/40 mt-1">Yangi tahlillar va kunlik hisobotlar emailda</div>
                      </div>
                      <div className="w-10 h-6 bg-[#1497F3] rounded-full relative">
                        <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full"></div>
                      </div>
                    </label>
                    
                    <label className="flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-xl cursor-pointer">
                      <div>
                        <div className="font-medium text-white/90">Yangi xususiyatlar</div>
                        <div className="text-xs text-white/40 mt-1">Platformadagi yangiliklar haqida ma'lumot</div>
                      </div>
                      <div className="w-10 h-6 bg-white/20 rounded-full relative">
                        <div className="absolute left-1 top-1 bg-white ml-0 w-4 h-4 rounded-full"></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ADMIN TAB */}
          {activeTab === 'admin' && userData?.is_admin && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-1">Admin Panel</h3>
                <p className="text-white/50 text-sm">Foydalanuvchilarni qidirish va kreditlarni boshqarish</p>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => setAdminView('users')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${adminView === 'users' ? 'bg-[#1497F3] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>Foydalanuvchilar</button>
                  <button onClick={() => setAdminView('plans')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${adminView === 'plans' ? 'bg-[#1497F3] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>Tariflar</button>
                  <button onClick={() => setAdminView('payments')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${adminView === 'payments' ? 'bg-[#1497F3] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>To'lov arizalari</button>
                  <button onClick={() => setAdminView('settings')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${adminView === 'settings' ? 'bg-[#1497F3] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>Sozlamalar</button>
                  <button onClick={() => setAdminView('spinwheel')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${adminView === 'spinwheel' ? 'bg-[#1497F3] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>Spin Wheel</button>
                  <button onClick={() => setAdminView('banners')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${adminView === 'banners' ? 'bg-[#1497F3] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>Promo Banners</button>
                  <button onClick={() => setAdminView('landing')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${adminView === 'landing' ? 'bg-[#1497F3] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>Landing Manager</button>
                </div>
              </div>

              {adminView === 'users' && (
              <div className="bg-white/5 border border-[#1497F3]/30 rounded-2xl p-6 space-y-6">
                <div>
                   <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Foydalanuvchi ID</label>
                   <div className="flex gap-2">
                     <input type="text" value={adminSearchEmail} onChange={e => setAdminSearchEmail(e.target.value)} placeholder="User ID kiriting" className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1497F3] transition-colors" />
                     <button onClick={handleAdminSearch} className="px-6 py-3 bg-[#1497F3] hover:bg-[#1497F3]/90 text-white rounded-xl font-medium transition-colors">Qidirish</button>
                   </div>
                </div>

                {adminFoundUser && (
                  <div className="pt-6 border-t border-white/10 space-y-6">
                     <div className="flex justify-between items-center bg-black/30 p-4 rounded-xl border border-white/5">
                        <div>
                           <div className="font-medium">{adminFoundUser.id}</div>
                           <div className="text-xs text-white/50 mt-1">
                              Joriy tarif: <span className="text-[#1497F3] font-bold mr-2">{(adminFoundUser.plan_id || 'free').toUpperCase()}</span>
                              Qolgan Kreditlar: <span className="text-[#1497F3] font-bold text-sm">{Math.max((adminFoundUser.total_credits || 0) - (adminFoundUser.used_credits || 0), 0)}</span> (Umumiy: {adminFoundUser.total_credits || 0}, Ishlatilgan: {adminFoundUser.used_credits || 0})
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Amaliyot miqdori (kreditda)</label>
                           <input type="number" value={adminActionCredits} onChange={e => setAdminActionCredits(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1497F3] transition-colors mb-4" />
                           
                           <div className="flex flex-col gap-2">
                              <button onClick={() => handleAdminUpdateCredits('add')} className="w-full py-2.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl font-medium hover:bg-green-500/30 transition-colors">Qo'shish</button>
                              <button onClick={() => handleAdminUpdateCredits('remove')} className="w-full py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-medium hover:bg-red-500/30 transition-colors">Olib tashlash</button>
                              <button onClick={() => handleAdminUpdateCredits('reset')} className="w-full py-2.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-xl font-medium hover:bg-yellow-500/30 transition-colors">Reset qilish</button>
                           </div>
                        </div>

                        <div>
                           <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Tarifni o'zgartirish</label>
                           <select value={adminActionPlan} onChange={e => setAdminActionPlan(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#1497F3] transition-colors mb-4 appearance-none">
                              <option value="free">FREE</option>
                              <option value="starter">STARTER</option>
                              <option value="pro">PRO</option>
                              <option value="team">TEAM</option>
                              <option value="agency">AGENCY</option>
                           </select>
                           <button onClick={handleAdminUpdatePlan} className="w-full py-2.5 bg-[#1497F3]/20 text-[#1497F3] border border-[#1497F3]/30 rounded-xl font-medium hover:bg-[#1497F3]/30 transition-colors">Tarifni saqlash</button>
                        </div>
                     </div>
                  </div>
                )}
              </div>
              )}

              {adminView === 'plans' && (
                <div className="bg-white/5 border border-[#1497F3]/30 rounded-2xl p-6 space-y-6">
                   <div className="flex justify-between items-center mb-4">
                     <h4 className="font-bold">Tarif sozlamalari</h4>
                     {adminPlans.length === 0 && (
                        <button onClick={handleSeedPlans} className="px-4 py-2 bg-[#1497F3] text-white rounded-xl text-sm font-medium">Boshlang'ich tariflarni yaratish</button>
                     )}
                   </div>
                   
                   {adminPlans.map(plan => (
                      <div key={plan.id} className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-4">
                         <div className="flex items-center justify-between pointer-events-none">
                            <span className="font-bold text-lg">{plan.name}</span>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <label className="block text-xs font-semibold text-white/50 mb-1">Narxi ($/oy)</label>
                               <input type="number" value={plan.price || 0} onChange={(e) => handleAdminUpdatePlanSetting(plan.id, 'price', Number(e.target.value))} onBlur={(e) => handleAdminUpdatePlanSetting(plan.id, 'price', Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#1497F3]" />
                            </div>
                            <div>
                               <label className="block text-xs font-semibold text-white/50 mb-1">Kreditlar</label>
                               <input type="number" value={plan.credits || 0} onChange={(e) => handleAdminUpdatePlanSetting(plan.id, 'credits', Number(e.target.value))} onBlur={(e) => handleAdminUpdatePlanSetting(plan.id, 'credits', Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#1497F3]" />
                            </div>
                         </div>
                         <div>
                            <label className="block text-xs font-semibold text-white/50 mb-1">Xususiyatlar (vergul bilan ajrating)</label>
                            <input type="text" value={(plan.features || []).join(', ')} onChange={(e) => {
                               const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                               handleAdminUpdatePlanSetting(plan.id, 'features', arr);
                            }} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#1497F3]" />
                         </div>
                      </div>
                   ))}
                </div>
              )}

              {adminView === 'payments' && (
                <div className="bg-white/5 border border-[#1497F3]/30 rounded-2xl p-6 space-y-6">
                   <h4 className="font-bold">To'lov arizalari</h4>
                   <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                       <input type="text" placeholder="Qidirish (email, ism, sana)" value={adminPaymentsSearch} onChange={e => setAdminPaymentsSearch(e.target.value)} className="w-full md:w-auto bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#1497F3]" />
                       <select value={adminPaymentsFilter} onChange={e => setAdminPaymentsFilter(e.target.value)} className="w-full md:w-auto bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#1497F3] appearance-none">
                           <option value="all">Barchasi</option>
                           <option value="pending">Kutilmoqda</option>
                           <option value="approved">Tasdiqlangan</option>
                           <option value="rejected">Rad etilgan</option>
                       </select>
                   </div>
                   {filteredAdminPayments.length === 0 ? (
                      <p className="text-white/50 text-sm">Hali arizalar yo'q.</p>
                   ) : (
                      <div className="space-y-4">
                         {filteredAdminPayments.map(p => (
                            <div key={p.id} className="bg-black/30 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
                               <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                  <div>
                                     <div className="font-medium text-lg">{p.userName} - {p.amount} {p.method}</div>
                                     <div className="text-xs text-white/50 mt-1">Foydalanuvchi: {p.email || p.userId} | Sana: {new Date(p.createdAt).toLocaleString('uz-UZ')}</div>
                                     {p.comment && <div className="text-sm mt-2 text-white/70 italic">"{p.comment}"</div>}
                                  </div>
                                  <div>
                                     <span className={`px-3 py-1 rounded-md text-xs font-semibold ${p.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : p.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {p.status === 'pending' ? 'Kutilmoqda' : p.status === 'approved' ? 'Tasdiqlangan' : 'Rad etilgan'}
                                     </span>
                                  </div>
                               </div>
                               
                               {p.screenshot && (
                                  <div>
                                     <p className="text-xs text-white/50 mb-2">Skrinshot:</p>
                                     <img src={p.screenshot} alt="Payment" className="w-full max-w-sm rounded-lg border border-white/10" />
                                  </div>
                               )}
                               
                               {p.status === 'pending' && (
                                  <div className="flex gap-2 mt-2 pt-4 border-t border-white/5">
                                     <button onClick={() => handleAdminPaymentAction(p.id, 'approve', p.userId, p.amount)} className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors">
                                        Tasdiqlash
                                     </button>
                                     <button onClick={() => {
                                        const reason = prompt('Rad etish sababini kiriting (Ixtiyoriy):');
                                        if (reason !== null) {
                                           handleAdminPaymentAction(p.id, 'reject', p.userId, p.amount, reason);
                                        }
                                     }} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors">
                                        Rad etish
                                     </button>
                                  </div>
                               )}
                            </div>
                         ))}
                      </div>
                   )}
                </div>
              )}

              {adminView === 'settings' && (
                <div className="bg-white/5 border border-[#1497F3]/30 rounded-2xl p-6 space-y-6">
                   <h4 className="font-bold">Umumiy tizim sozlamalari</h4>
                   <div className="space-y-4">
                      <div>
                         <label className="block text-xs font-semibold text-white/50 mb-1">Humo Karta raqami</label>
                         <input type="text" value={adminAppSettings?.humoCard || ''} onChange={e => setAdminAppSettings(prev => ({ ...prev, humoCard: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#1497F3]" />
                      </div>
                      <div>
                         <label className="block text-xs font-semibold text-white/50 mb-1">Humo Karta egasi</label>
                         <input type="text" value={adminAppSettings?.humoHolder || ''} onChange={e => setAdminAppSettings(prev => ({ ...prev, humoHolder: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#1497F3]" />
                      </div>
                      <div className="pt-4">
                         <label className="block text-xs font-semibold text-white/50 mb-1">Visa Karta raqami</label>
                         <input type="text" value={adminAppSettings?.visaCard || ''} onChange={e => setAdminAppSettings(prev => ({ ...prev, visaCard: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#1497F3]" />
                      </div>
                      <div>
                         <label className="block text-xs font-semibold text-white/50 mb-1">Visa Karta egasi</label>
                         <input type="text" value={adminAppSettings?.visaHolder || ''} onChange={e => setAdminAppSettings(prev => ({ ...prev, visaHolder: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#1497F3]" />
                      </div>
                      <div className="pt-4">
                         <label className="block text-xs font-semibold text-white/50 mb-1">Support Manzili (Url / Tg link)</label>
                         <input type="text" value={adminAppSettings?.supportLink || ''} onChange={e => setAdminAppSettings(prev => ({ ...prev, supportLink: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#1497F3]" />
                      </div>
                      
                      <button onClick={handleSaveAppSettings} className="mt-4 px-6 py-2 bg-[#1497F3] text-white rounded-xl text-sm font-medium transition-colors">Saqlash</button>
                   </div>
                </div>
              )}

              {adminView === 'spinwheel' && (
                <div className="bg-white/5 border border-[#1497F3]/30 rounded-2xl p-6 space-y-6">
                   <div className="flex justify-between items-center">
                     <h4 className="font-bold">Spin Wheel Sozlamalari</h4>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm">Yoqilgan</span>
                        <input type="checkbox" checked={adminSpinSettings?.enabled !== false} onChange={e => setAdminSpinSettings((prev: any) => ({ ...prev, enabled: e.target.checked }))} className="w-5 h-5 accent-[#1497F3]" />
                     </label>
                   </div>
                   
                   <div>
                     <h5 className="font-semibold text-sm mb-3">Sovrinlar (JSON Formatida)</h5>
                     <textarea 
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#1497F3] h-48 font-mono"
                        defaultValue={JSON.stringify(adminSpinSettings?.rewards || [], null, 2)}
                        onBlur={e => {
                           try {
                              const parsed = JSON.parse(e.target.value);
                              setAdminSpinSettings((prev: any) => ({ ...prev, rewards: parsed }));
                           } catch(err) {
                              onShowToast("JSON formatida xatolik!");
                           }
                        }}
                     ></textarea>
                     <p className="text-xs text-white/40 mt-1">Siz to'g'ri JSON formatida kiritishingiz kerak. O'zgarishlar e'tibori uchun textarea tashqarisiga bosing (blur). "Saqlash" ni bosgach bazaga yoziladi.</p>
                   </div>
                   
                   <button onClick={handleSaveSpinSettings} className="px-6 py-2 bg-[#1497F3] text-white rounded-xl text-sm font-medium transition-colors">Saqlash</button>
                   
                   <div className="pt-6 border-t border-white/10">
                      <h5 className="font-semibold text-sm mb-3">Statistika</h5>
                      <div className="flex gap-4 mb-4">
                         <div className="bg-black/30 border border-white/5 p-4 rounded-xl flex-1">
                            <p className="text-white/50 text-xs uppercase font-semibold mb-1">Jami aylanmalar</p>
                            <p className="font-bold text-2xl">{adminSpinHistory.length}</p>
                         </div>
                         <div className="bg-black/30 border border-white/5 p-4 rounded-xl flex-1">
                            <p className="text-white/50 text-xs uppercase font-semibold mb-1">Eng ko'p tushgan sovrin</p>
                            <p className="font-bold text-xl truncate">
                               {(() => {
                                  if (!adminSpinHistory.length) return "Noma'lum";
                                  const counts = adminSpinHistory.reduce((acc, h) => {
                                     acc[h.rewardLabel] = (acc[h.rewardLabel] || 0) + 1;
                                     return acc;
                                  }, {} as Record<string, number>);
                                  const max = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0];
                                  return `${max[0]} (${max[1]}x)`;
                               })()}
                            </p>
                         </div>
                      </div>

                      <h5 className="font-semibold text-sm mb-3">Aylantirishlar Tarixi</h5>
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                         {adminSpinHistory.length === 0 ? (
                             <p className="text-white/40 text-xs">Hali hech kim aylantirmagan.</p>
                         ) : (
                             adminSpinHistory.map((h, i) => (
                                 <div key={h.id || i} className="flex justify-between items-center bg-black/30 p-2 rounded-lg text-xs border border-white/5">
                                     <div>
                                         <span className="font-medium text-white/80">{h.userEmail || h.userId}</span>
                                         <span className="text-white/40 ml-2">{new Date(h.createdAt).toLocaleString('uz-UZ')}</span>
                                     </div>
                                     <div className="text-[#1497F3] font-semibold">{h.rewardLabel}</div>
                                 </div>
                             ))
                         )}
                      </div>
                   </div>
                </div>
              )}

              {adminView === 'banners' && (
                <AdminBanners onShowToast={onShowToast} />
              )}
              
              {adminView === 'landing' && (
                <LandingManager onShowToast={onShowToast} />
              )}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
