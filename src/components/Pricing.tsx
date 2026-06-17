import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Shield, Users, Building, Zap, Rocket, Award } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';

interface PricingProps {
  user: any;
  onShowToast: (msg: string) => void;
  onNavigateToProfile: () => void;
  hideHeader?: boolean;
  onRequireAuth?: (cb: () => void) => void;
}

export default function Pricing({ user, onShowToast, onNavigateToProfile, hideHeader = false, onRequireAuth }: PricingProps) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);

  // Default plans fallback in case firestore doesn't have them yet or failed to fetch
  const defaultPlans = [
    {
      id: 'free',
      name: 'FREE',
      price: 0,
      credits: 20,
      features: ['Winning Product Finder', 'Ad Analyzer'],
      notIncluded: ['Competitor Spy', 'Export Reports', 'Saved Reports', 'Priority Support'],
      highlight: false,
      icon: <Check size={20} className="text-[#1497F3]" />
    },
    {
      id: 'starter',
      name: 'STARTER',
      price: 15,
      credits: 100,
      features: ['Winning Product Finder', 'Trend Hunter', 'Ad Analyzer', 'Saved Reports'],
      notIncluded: ['Competitor Spy', 'Export Reports', 'Priority Support'],
      highlight: false,
      icon: <Rocket size={20} className="text-[#1497F3]" />
    },
    {
      id: 'pro',
      name: 'PRO',
      price: 49,
      credits: 300,
      features: ['Winning Product Finder', 'Trend Hunter', 'Competitor Spy', 'Ad Analyzer', 'Export Reports', 'Saved Reports'],
      notIncluded: ['Priority Support'],
      highlight: true,
      popular: true,
      icon: <Zap size={20} className="text-white" />
    },
    {
      id: 'team',
      name: 'TEAM',
      price: 129,
      credits: 1000,
      features: ['Winning Product Finder', 'Trend Hunter', 'Competitor Spy', 'Ad Analyzer', 'Export Reports', 'Saved Reports', 'Team Members', 'Shared Reports', 'Priority Queue'],
      notIncluded: ['White Label Reports', 'Dedicated Support'],
      highlight: false,
      icon: <Users size={20} className="text-[#1497F3]" />
    },
    {
      id: 'agency',
      name: 'AGENCY',
      price: 299,
      credits: 5000,
      features: ['Winning Product Finder', 'Trend Hunter', 'Competitor Spy', 'Ad Analyzer', 'Export Reports', 'Saved Reports', 'Unlimited Team Members', 'White Label Reports', 'Advanced Analytics', 'Dedicated Support'],
      notIncluded: [],
      highlight: false,
      icon: <Building size={20} className="text-[#1497F3]" />
    }
  ];

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansCol = collection(db, 'plans');
        const planSnap = await getDocs(plansCol);
        
        if (!planSnap.empty) {
            const fetchedPlans: any[] = [];
            planSnap.forEach(doc => {
               fetchedPlans.push({ id: doc.id, ...doc.data() });
            });
            // We need to sort them somehow, maybe by price
            fetchedPlans.sort((a, b) => (a.price || 0) - (b.price || 0));
            
            // map them to the UI structure roughly
            const merged = defaultPlans.map(dp => {
                const fp = fetchedPlans.find(f => f.id === dp.id);
                if (fp) {
                    return { ...dp, name: fp.name || dp.name, price: fp.price !== undefined ? fp.price : dp.price, credits: fp.credits !== undefined ? fp.credits : dp.credits };
                }
                return dp;
            });
            setPlans(merged);
        } else {
            setPlans(defaultPlans);
        }
      } catch (e) {
          console.error(e);
          setPlans(defaultPlans);
      } finally {
          setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const [modalState, setModalState] = useState<{type: 'none' | 'confirm' | 'insufficient', plan?: any}>({ type: 'none' });
  const [userBalance, setUserBalance] = useState(0);

  const handleSelectPlan = async (selectedPlan: any) => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth(() => handleSelectPlan(selectedPlan));
      }
      return;
    }
    setLoading(true);
    try {
       const uSnap = await getDoc(doc(db, 'users', user.uid));
       const balance = uSnap.exists() ? (uSnap.data().balance || 0) : 0;
       setUserBalance(balance);
       
       if (balance >= selectedPlan.price) {
           setModalState({ type: 'confirm', plan: selectedPlan });
       } else {
           setModalState({ type: 'insufficient', plan: selectedPlan });
       }
    } catch (e: any) {
       console.error(e);
       onShowToast("Xatolik: balance tekshirib bo'lmadi");
    } finally {
       setLoading(false);
    }
  };

  const handleConfirmPurchase = async () => {
     if (!user || modalState.type !== 'confirm' || !modalState.plan) return;
     setLoading(true);
     try {
         const p = modalState.plan;
         const newBalance = userBalance - p.price;
         const uRef = doc(db, 'users', user.uid);
         const uSnap = await getDoc(uRef);
         const currentTotalCredits = uSnap.exists() ? (uSnap.data().total_credits || 0) : 0;

         await updateDoc(uRef, {
            balance: newBalance,
            plan_id: p.id,
            total_credits: currentTotalCredits + p.credits,
            updatedAt: Date.now()
         });

         // Record transaction log
         const logRef = doc(collection(db, 'audit_logs'));
         await setDoc(logRef, {
             action: 'purchase_plan',
             target: user.uid,
             plan_id: p.id,
             price: p.price,
             timestamp: new Date()
         });

         onShowToast(`${p.name} tarifi faollashtirildi!`);
         setModalState({ type: 'none' });
     } catch (e: any) {
         console.error(e);
         onShowToast("Xaridda xatolik yuz berdi");
     } finally {
         setLoading(false);
     }
  };

  const featureList = [
    'Winning Product Finder',
    'Trend Hunter',
    'Competitor Spy',
    'Ad Analyzer',
    'Export Reports',
    'Saved Reports',
    'Team Access',
    'Priority Support'
  ];

  if (loading) {
     return <div className="flex-1 flex items-center justify-center bg-[#000000] text-white">Loading...</div>;
  }

  return (
    <div className={`flex flex-col text-white relative z-10 w-full ${hideHeader ? 'bg-transparent' : 'flex-1 bg-[#000000] overflow-y-auto p-6 lg:p-12 custom-scrollbar'}`}>
      
      <div className="max-w-7xl mx-auto w-full">
         {!hideHeader && (
           <div className="text-center mb-16 mt-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Savdo biznesingiz uchun <span className="text-[#1497F3]">AI narxlar</span></h1>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">Hech qanday maxfiy to'lovlarsiz shaffof xarajatlar. Maqsadingizga mos keladigan tarifni tanlang.</p>
           </div>
         )}

         {/* Section 1: Pricing Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-24 items-end">
            {plans.map((plan, index) => (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={plan.id} 
                    className={`rounded-3xl p-6 relative flex flex-col ${plan.highlight ? 'bg-gradient-to-b from-[#1497F3]/20 to-[#1497F3]/5 border-2 border-[#1497F3] shadow-[0_0_30px_rgba(20,151,243,0.15)]' : 'bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10'} transition-all`}
                >
                    {plan.popular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1497F3] text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider">
                            EN KO'P TANLANGAN
                        </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-xl ${plan.highlight ? 'bg-[#1497F3]' : 'bg-white/10'}`}>
                            {plan.icon}
                        </div>
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                    </div>
                    
                    <div className="mb-6">
                        <span className="text-3xl font-extrabold flex items-start">
                            <span className="text-lg mt-1 mr-1 text-white/50">$</span>
                            {plan.price}
                        </span>
                        <span className="text-white/40 text-sm">/ oy</span>
                    </div>
                    
                    <div className="bg-black/30 rounded-xl p-3 mb-6 border border-white/5 flex items-center justify-between">
                        <span className="text-sm font-medium text-white/80">Kreditlar</span>
                        <span className="font-bold text-[#1497F3]">{plan.credits}</span>
                    </div>
                    
                    <ul className="space-y-3 mb-8 flex-1">
                        {plan.features.map((f: string) => (
                            <li key={f} className="flex items-start gap-3 text-sm">
                                <Check size={16} className="text-green-400 shrink-0 mt-0.5" />
                                <span className="text-white/90">{f}</span>
                            </li>
                        ))}
                        {plan.notIncluded.map((f: string) => (
                            <li key={f} className="flex items-start gap-3 text-sm opacity-50">
                                <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                                <span>{f}</span>
                            </li>
                        ))}
                    </ul>
                    
                    <button onClick={() => handleSelectPlan(plan)} className={`w-full py-3 rounded-xl font-semibold transition-colors ${plan.highlight ? 'bg-[#1497F3] hover:bg-[#1497F3]/90 text-white shadow-lg shadow-[#1497F3]/20' : 'bg-white text-black hover:bg-gray-200'}`}>
                        Tanlash
                    </button>
                </motion.div>
            ))}
         </div>

         {/* Section 2: Comparison Table */}
         <div className="mb-24 overflow-x-auto custom-scrollbar pb-6">
             <h2 className="text-2xl font-bold mb-8 text-center">Xususiyatlarni solishtirish</h2>
             
             <div className="min-w-[800px] border border-white/10 rounded-3xl overflow-hidden bg-black/40 backdrop-blur-md">
                 <div className="grid grid-cols-6 border-b border-white/10 bg-white/5 p-4 items-center">
                     <div className="font-bold text-white/70">Xususiyat</div>
                     {plans.map(p => <div key={p.id} className="text-center font-bold text-sm tracking-wider">{p.name}</div>)}
                 </div>
                 
                 {featureList.map((feature, i) => (
                     <div key={i} className={`grid grid-cols-6 p-4 items-center ${i % 2 === 0 ? '' : 'bg-white/5'} border-b border-white/5 hover:bg-white/10 transition-colors`}>
                         <div className="text-sm text-white/80">{feature}</div>
                         {plans.map(p => {
                            const hasFeature = (p.features || []).includes(feature);

                            return (
                                <div key={p.id} className="flex justify-center">
                                    {hasFeature ? <Check size={18} className="text-[#1497F3]" /> : <span className="w-4 border-t border-white/20"></span>}
                                </div>
                            );
                         })}
                     </div>
                 ))}
             </div>
         </div>

         {/* Section 3: FAQ */}
         <div className="max-w-3xl mx-auto mb-24">
            <h2 className="text-2xl font-bold mb-8 text-center">Tez-tez so'raladigan savollar</h2>
            
            <div className="space-y-4">
               {[
                   { q: "Kreditlar qanday hisoblanadi?", a: "Har bir so'rov yoki analiz turiga qarab kreditingizdan belgilar olinadi. Masalan, mahsulot analizi 5 kredit bo'lsa, uni ishlatish hisobingizdan 5 kredit yechib oladi." },
                   { q: "Ishlatilmay qolgan kreditlar keyingi oyga o'tadimi?", a: "Yo'q, obuna bo'yicha berilgan kreditlar har oy oxirida yangilanadi. Ammo qo'shimcha sotib olingan paketlar o'z kuchida qoladi." },
                   { q: "Tarifni istalgan paytda o'zgartira olamanmi?", a: "Ha, profilingizdan istalgan vaqtda yuqoriroq tarifga o'tishingiz mumkin." }
               ].map((faq, i) => (
                   <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                       <h4 className="font-semibold text-lg mb-2">{faq.q}</h4>
                       <p className="text-white/60 text-sm leading-relaxed">{faq.a}</p>
                   </div>
               ))}
            </div>
         </div>
         
         {/* Section 4: CTA */}
         <div className="bg-gradient-to-r from-[#1497F3]/20 to-purple-500/20 border border-[#1497F3]/30 rounded-3xl p-10 md:p-16 text-center max-w-4xl mx-auto mb-24 relative overflow-hidden">
             <div className="relative z-10">
                 <h2 className="text-3xl font-bold mb-4">Savdolarni keyingi bosqichga olib chiqing</h2>
                 <p className="text-white/60 mb-8 max-w-xl mx-auto">To'g'ri tarifni tanlash bilan ko'proq imkoniyatlarga ega bo'lasiz va bozorni yaxshi his qilasiz.</p>
                 <button onClick={onNavigateToProfile} className="px-8 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors inline-flex items-center gap-2 shadow-xl shadow-white/10">
                     Profilga o'tish <Rocket size={18} />
                 </button>
             </div>
             
             {/* bg effects */}
             <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                 <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#1497F3]/20 rounded-full blur-3xl"></div>
                 <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
             </div>
         </div>
      </div>

      {/* Confirmation Modal */}
      {modalState.type === 'confirm' && modalState.plan && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <div className="bg-[#0A0D12] border border-white/10 rounded-2xl w-full max-w-md p-6">
                 <h3 className="text-xl font-bold mb-4">Tarifni tasdiqlash</h3>
                 <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                       <span className="text-white/50">Tarif nomi:</span>
                       <span className="font-bold">{modalState.plan.name}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-white/50">Narxi:</span>
                       <span className="font-bold text-[#1497F3]">{modalState.plan.price}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-white/50">Joriy balans:</span>
                       <span className="font-bold">{userBalance}</span>
                    </div>
                    <div className="border-t border-white/10 pt-4 flex justify-between">
                       <span className="text-white/80 font-bold">Qolgan balans:</span>
                       <span className="font-bold text-white">{userBalance - modalState.plan.price}</span>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setModalState({ type: 'none' })} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors">Bekor qilish</button>
                    <button onClick={handleConfirmPurchase} className="flex-1 px-4 py-2 bg-[#1497F3] hover:bg-[#1497F3]/90 text-white font-bold rounded-xl shadow-lg transition-colors">Sotib olish</button>
                 </div>
             </div>
         </div>
      )}

      {/* Insufficient Balance Modal */}
      {modalState.type === 'insufficient' && modalState.plan && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <div className="bg-[#0A0D12] border border-white/10 rounded-2xl w-full max-w-md p-6">
                 <h3 className="text-xl font-bold mb-4 text-red-500 flex items-center gap-2"><X size={24} /> Mablag' yetarli emas</h3>
                 <p className="text-white/70 mb-6">
                    Siz chormoqchi bo'lgan <strong>{modalState.plan.name}</strong> tarifi uchun balansda yetarli mablag' yo'q. <br/><br/>
                    Tarif narxi: {modalState.plan.price} <br/>
                    Joriy balans: {userBalance} <br/>
                    Yana kerak: <span className="font-bold text-[#1497F3]">{modalState.plan.price - userBalance}</span>
                 </p>
                 <div className="flex gap-4">
                    <button onClick={() => setModalState({ type: 'none' })} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors">Bekor qilish</button>
                    <button onClick={() => { setModalState({ type: 'none' }); onNavigateToProfile(); }} className="flex-1 px-4 py-2 bg-[#1497F3] hover:bg-[#1497F3]/90 text-white font-bold rounded-xl shadow-lg transition-colors">Balansni to'ldirish</button>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
}
