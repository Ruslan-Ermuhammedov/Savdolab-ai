import React, { useState, useRef, useEffect } from 'react';
import { Upload, ArrowUp, Loader2, Image as ImageIcon, Sparkles, Download, Search, Activity, Tag, Link as LinkIcon, DollarSign, Plus, ArrowRight, User, Copy, Check, FileText, ChevronDown, Flame, Megaphone, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AnalysisResponse, AppMode } from '../types';
import vibeSellingLogo from '../Vector 12.png';
import WinningProductView from './AnalyzerWinningProduct';
import TrendingProductsView from './AnalyzerTrendingProducts';
import CompetitorSpyView from './AnalyzerCompetitorSpy';
import AdAnalyzerView from './AnalyzerAdAnalyzer';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, setDoc, query, where, getDocs } from 'firebase/firestore';

interface AnalyzerProps {
  initialQuery?: string;
  initialMode?: AppMode;
  onAnalysisComplete?: (query: string, mode: string) => void;
  user?: any;
  key?: React.Key;
  onNavigateToPricing?: () => void;
  onShowToast: (msg: string) => void;
}

export default function AnalyzerInterface({ initialQuery = '', initialMode = 'winning-product', onAnalysisComplete, user, onNavigateToPricing, onShowToast }: AnalyzerProps) {
  const [prompt, setPrompt] = useState(initialQuery);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<'UZ' | 'RU' | 'EN'>('UZ');
  
  const [activeMode, setActiveMode] = useState<AppMode>(initialMode);
  const [showAutoSuggest, setShowAutoSuggest] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleFocusPrompt = () => {
      promptInputRef.current?.focus();
    };
    window.addEventListener('focusPrompt', handleFocusPrompt);
    return () => window.removeEventListener('focusPrompt', handleFocusPrompt);
  }, []);

  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const loadingSteps = [
    "So'rov qabul qilindi...",
    "Kiritilgan ma'lumotlar analiz qilinmoqda...",
    "Internetdan global trendlar qidirilmoqda...",
    "Natijalar solishtirilmoqda...",
    "Professional hisobot tayyorlanmoqda..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStepIdx(0);
      interval = setInterval(() => {
        setLoadingStepIdx(prev => Math.min(prev + 1, loadingSteps.length - 1));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const performAnalysis = async (queryText: string, imgFile: File | null = null, modeToUse: AppMode) => {
    setSubmittedPrompt(queryText || "Rasm orqali qidiruv");
    setLoading(true);
    setError(null);
    setResult(null);

    const featureCosts: Record<string, number> = {
      'winning-product': 5,
      'trending-products': 8,
      'competitor-spy': 12,
      'ad-analyzer': 6,
    };
    
    const requiredCredits = featureCosts[modeToUse] + (imgFile ? 2 : 0);
    let userData = null;
    let newUsedCredits = 0;

    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          userData = userSnap.data();
          const totalC = userData.total_credits || 0;
          const usedC = userData.used_credits || 0;
          
          let planId = userData.plan_id || 'free';
          const planRef = doc(db, 'plans', planId);
          const planSnap = await getDoc(planRef);
          
          let hasAccess = true;
          if (planSnap.exists()) {
             const pd = planSnap.data();
             const planFeatures = pd.features || [];
             if (modeToUse === 'competitor-spy' && !planFeatures.includes('Competitor Spy')) hasAccess = false;
             if (modeToUse === 'trending-products' && !planFeatures.includes('Trend Hunter')) hasAccess = false;
          } else {
             if (modeToUse === 'competitor-spy' && planId === 'free') hasAccess = false;
          }
          
          if (!hasAccess) {
             setLoading(false);
             setError("Bu xususiyat joriy tarifingizda mavjud emas. Iltimos, tarifingizni oshiring.");
             return;
          }

          if (totalC - usedC < requiredCredits) {
             setLoading(false);
             setShowUpgradeModal(true);
             return;
          }
          newUsedCredits = usedC + requiredCredits;
        }
      } catch (e) {
        console.error("Credit check failed:", e);
      }
    }

    try {
      const payload: any = { text: queryText || "Ushbu mahsulotni analiz qiling", lang, mode: modeToUse };
      
      if (imgFile) {
        const base64Data = await fileToBase64(imgFile);
        payload.image = {
          mimeType: imgFile.type,
          data: base64Data
        };
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze product');
      }

      const data = await response.json();
      setResult(data);
      
      // Consume credits
      if (user?.uid && userData) {
         try {
           await updateDoc(doc(db, 'users', user.uid), {
             used_credits: newUsedCredits,
             updatedAt: Date.now()
           });
           
           await addDoc(collection(db, 'usage_logs'), {
             userId: user.uid,
             feature: modeToUse,
             credits_consumed: requiredCredits,
             timestamp: Date.now()
           });
         } catch (e) {
             console.error("Failed to update credits:", e);
         }
      }

      if (onAnalysisComplete) {
        onAnalysisComplete(queryText || "Image Search", modeToUse);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performAnalysis(initialQuery, null, activeMode);
    }
  }, [initialQuery]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() && !image) return;
    setShowAutoSuggest(false);
    performAnalysis(prompt, image, activeMode);
  };

  const handleSuggestionClick = (text: string) => {
    setPrompt(text);
    setShowAutoSuggest(false);
    performAnalysis(text, image, activeMode);
  };

  const getAutoSuggestions = () => {
    if (!prompt.trim()) return [];
    
    let suggestions: string[] = [];
    if (activeMode === 'winning-product') {
      suggestions = [
        "Elektron termos sotuvlari...",
        "Smart watch narxlar tahlili...",
        "Kuzgi poyabzallar trendi...",
        "Mini blender foydasi..."
      ];
    } else if (activeMode === 'trending-products') {
      suggestions = [
        "Uy jihozlari",
        "Elektronika",
        "Kosmetika",
        "Avtomobil anjomlari"
      ];
    } else if (activeMode === 'competitor-spy') {
      suggestions = [
        "uzum.uz/uy-roozghor",
        "olx.uz elektronika",
        "Zoodmall texnika",
        "Texnomart"
      ];
    } else {
      suggestions = [
        "Soch to'kilishiga qarshi vosita",
        "Noutbuk uchun taglik",
        "Skidka bilan kiyimlar",
        "Yuzni oqartiruvchi krem"
      ];
    }
    
    const search = prompt.toLowerCase();
    return suggestions.filter(s => s.toLowerCase().includes(search));
  };

  const currentSuggestions = getAutoSuggestions();

  const handleDownloadCSV = async () => {
    if (!result?.data) return;
    
    // Export Report cost is 4 credits
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const ud = userSnap.data();
          const planId = ud.plan_id || 'free';
          const planSnap = await getDoc(doc(db, 'plans', planId));
          const planFeatures = planSnap.exists() ? planSnap.data().features : [];
          if (planSnap.exists() && !planFeatures.includes('Export Reports')) {
             setError("Eksport qilish formati ushbu tarifda mavjud emas.");
             return;
          }

          const totalC = ud.total_credits || 0;
          const usedC = ud.used_credits || 0;
          if (totalC - usedC < 4) {
             setShowUpgradeModal(true);
             return;
          }
          await updateDoc(userRef, {
             used_credits: usedC + 4,
             updatedAt: Date.now()
          });
          await addDoc(collection(db, 'usage_logs'), {
             userId: user.uid,
             feature: 'export-csv',
             credits_consumed: 4,
             timestamp: Date.now()
          });
        }
      } catch (e) {
        console.error(e);
      }
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Exported Data\n";
    csvContent += JSON.stringify(result.data, null, 2);
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hisobot-${activeMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    //
  };

  const handleSaveReport = async () => {
    if (!result || !user?.uid) return;

    // Check plan limits
    let maxStorage = 0;
    try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
            const planId = userSnap.data().plan_id || 'free';
            if (planId === 'free') maxStorage = 0;
            else if (planId === 'starter') maxStorage = 5;
            else if (planId === 'pro') maxStorage = 50;
            else if (planId === 'team') maxStorage = 200;
            else if (planId === 'agency') maxStorage = 9999;
        }

        if (maxStorage === 0) {
            onShowToast("Free tarifda saqlash imkoniyati yo'q");
            return;
        }

        // Count existing
        const q = query(collection(db, 'saved_reports'), where('userId', '==', user.uid));
        const currentSnap = await getDocs(q);
        if (currentSnap.size >= maxStorage) {
            onShowToast(`Tarif limingiz to'ldi (${maxStorage} ta)`);
            return;
        }

        // Save
        const newRef = doc(collection(db, 'saved_reports'));
        await setDoc(newRef, {
            userId: user.uid,
            type: result.mode,
            title: submittedPrompt || 'Tahlil Natijasi',
            data: result.data,
            createdAt: Date.now()
        });

        onShowToast("Hisobot saqlandi!");
    } catch(err) {
        console.error(err);
        onShowToast("Xatolik yuz berdi");
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const ud = userSnap.data();
          const planId = ud.plan_id || 'free';
          const planSnap = await getDoc(doc(db, 'plans', planId));
          const planFeatures = planSnap.exists() ? planSnap.data().features : [];
          if (planSnap.exists() && !planFeatures.includes('Export Reports')) {
             setError("Eksport qilish formati ushbu tarifda mavjud emas.");
             return;
          }

          const totalC = ud.total_credits || 0;
          const usedC = ud.used_credits || 0;
          if (totalC - usedC < 4) {
             setShowUpgradeModal(true);
             return;
          }
          await updateDoc(userRef, {
             used_credits: usedC + 4,
             updatedAt: Date.now()
          });
          await addDoc(collection(db, 'usage_logs'), {
             userId: user.uid,
             feature: 'export-pdf',
             credits_consumed: 4,
             timestamp: Date.now()
          });
        }
      } catch (e) {
        console.error(e);
      }
    }

    try {
      onShowToast("PDF yuklanmoqda...");
      // Force non-oklab colors for capture
      element.style.setProperty('--color-indigo-600', '#4f46e5');
      element.style.setProperty('--color-blue-500', '#3b82f6');
      element.style.setProperty('--color-gray-900', '#111827');

      const canvas = await html2canvas(element, { 
        backgroundColor: '#111827',
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('report-content');
          if (el) {
            el.style.backgroundColor = '#111827';
            // Replace oklab/oklch colors if possible, but the best way is to set standard colors on the container
          }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`hisobot-${activeMode}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    }
  };

  const isChatMode = loading || result != null || error != null;

  const renderInputBox = () => (
    <div className="relative w-full max-w-[800px] mx-auto z-50">
      
      {/* Mode Selector Tabs */}
      {!isChatMode && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: 'winning-product', label: 'Winning Product', icon: Sparkles },
            { id: 'trending-products', label: 'Trending', icon: Flame },
            { id: 'competitor-spy', label: 'Competitor Spy', icon: Search },
            { id: 'ad-analyzer', label: 'Ad Analyzer', icon: Megaphone }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id as AppMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                activeMode === mode.id 
                  ? 'bg-[#1497F3]/20 border-[#1497F3] text-[#89E4FF] shadow-[0_0_15px_rgba(20,151,243,0.3)]' 
                  : 'bg-black/20 border-white/10 text-white/50 hover:text-white/80 hover:bg-black/40'
              }`}
            >
              <mode.icon size={16} />
              {mode.label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative group z-30">
         <motion.div 
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.99 }}
            className="relative group/input"
         >
           {loading && (
             <div className="absolute inset-[-2px] rounded-[30px] animate-glow-spin z-[-1] pointer-events-none opacity-80" />
           )}
           <div className={`absolute inset-0 rounded-[28px] pointer-events-none transition-all duration-500 group-hover:bg-white/20 group-focus-within/input:border-[#2EC8FF]/60 group-focus-within/input:shadow-[0_0_30px_rgba(46,200,255,0.3)] group-focus-within/input:bg-white/10 bg-[#0A0D12]/60 backdrop-blur-3xl border ${loading ? 'border-transparent' : 'border-white/25'} shadow-[0_20px_40px_rgba(0,0,0,0.4)]`} />
           
           <div className="relative flex items-center w-full min-h-[56px] md:h-[72px] px-3 md:px-6">
              <div 
                className="flex items-center bg-white/10 border border-white/20 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-full mr-2 md:mr-4 cursor-pointer hover:bg-white/20 transition-colors shadow-sm"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Image"
              >
                <div className="w-3.5 h-3.5 md:w-4 md:h-4 bg-white/20 rounded-full flex items-center justify-center mr-1 md:mr-1.5 backdrop-blur-md">
                   <Plus size={10} className="text-white" />
                </div>
                <span className="text-white text-[10px] md:text-xs font-semibold tracking-wide hidden sm:inline-block">Savdolab <span className="opacity-70 font-medium tracking-normal">Pro</span></span>
                <span className="text-white text-[10px] font-semibold tracking-wide sm:hidden">Pro</span>
              </div>
              
              <input
                ref={promptInputRef}
                type="text"
                value={prompt}
                onChange={e => {
                  setPrompt(e.target.value);
                  setShowAutoSuggest(true);
                }}
                onFocus={() => setShowAutoSuggest(true)}
                onBlur={() => setTimeout(() => setShowAutoSuggest(false), 200)}
                placeholder={
                  activeMode === 'winning-product' ? "Elektron termos yoki mahsulot rasmi..." :
                  activeMode === 'trending-products' ? "Masalan: Uy jihozlari, Kosmetika..." :
                  activeMode === 'competitor-spy' ? "Do'kon linki yoki brend nomi..." :
                  "Reklama matni, rasmi..."
                }
                className="flex-1 min-w-[50px] md:min-w-0 bg-transparent text-white placeholder-white/50 focus:outline-none text-sm md:text-[17px] overflow-hidden text-ellipsis whitespace-nowrap"
              />

              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

              {imagePreview && (
                 <div className="mr-2.5 md:mr-3 relative w-[32px] h-[32px] md:w-[42px] md:h-[42px] rounded-[10px] md:rounded-xl overflow-hidden border-2 border-[#1497F3] group/img shadow-md">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={handleRemoveImage} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <span className="text-white text-[10px] md:text-[12px] font-bold">✕</span>
                    </button>
                 </div>
              )}

              <motion.button 
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 type="submit" 
                 disabled={loading}
                 className="w-[38px] h-[38px] md:w-[46px] md:h-[46px] flex-shrink-0 flex items-center justify-center rounded-full ml-1 disabled:opacity-50" 
                 style={{ background: 'linear-gradient(135deg, #89E4FF, #C8FFFF)', boxShadow: '0 0 25px rgba(137,228,255,0.4)' }}
              >
                 {loading ? <Loader2 size={16} className="text-[#00243A] animate-spin md:w-5 md:h-5" /> : <ArrowUp size={18} className="text-[#00243A] md:w-5 md:h-5" strokeWidth={2.5} />}
              </motion.button>
           </div>

           {/* Auto-Suggest Dropdown */}
           <AnimatePresence>
             {showAutoSuggest && currentSuggestions.length > 0 && (
               <motion.div
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="absolute top-[110%] left-0 w-full bg-[#0A0D12]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 z-[60]"
               >
                 {currentSuggestions.map((s, idx) => (
                   <div 
                     key={idx}
                     onClick={() => handleSuggestionClick(s)}
                     className="px-4 py-3 hover:bg-white/10 rounded-xl cursor-pointer text-sm text-white/90 flex items-center gap-3 transition-colors"
                   >
                     <Search size={14} className="text-[#1497F3]" />
                     {s}
                   </div>
                 ))}
               </motion.div>
             )}
           </AnimatePresence>
         </motion.div>
      </form>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-screen bg-transparent relative scroll-smooth flex-shrink-0">
      
      <div className="absolute top-4 right-4 md:top-6 md:right-8 flex items-center gap-4 z-[100]">
         <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
           <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
             <span className="text-xs font-bold text-white tracking-wider lowercase">AI</span>
         </div>
         <div className="flex bg-[#0A0D12]/60 border border-white/10 rounded-full p-1 shadow-lg backdrop-blur-md">
           {(['UZ', 'RU', 'EN'] as const).map(l => (
             <button 
               key={l}
               onClick={() => setLang(l)}
               className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${lang === l ? 'bg-[#1497F3] text-white shadow-[0_0_15px_rgba(20,151,243,0.4)]' : 'text-white/50 hover:text-white'}`}
             >
               {l}
             </button>
           ))}
         </div>
      </div>

      <div className={`w-full mx-auto px-4 md:pl-[10px] md:pr-[20px] flex flex-col items-center justify-start h-full overflow-y-auto pb-40 transition-all duration-500`}>
        
        {!isChatMode ? (
          <div className="flex flex-col w-full items-center mt-4 md:mt-[30px] mb-8 md:mb-[70px]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0, boxShadow: ['0 0 50px rgba(50,173,223,0.3)', '0 0 90px rgba(50,173,223,0.5)', '0 0 50px rgba(50,173,223,0.3)'] }}
              transition={{ duration: 0.8, ease: "easeOut", boxShadow: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
              className="w-full rounded-3xl md:rounded-[36px] bg-[#0A1322]/50 backdrop-blur-2xl md:backdrop-blur-[60px] border border-white/20 shadow-2xl relative overflow-hidden flex flex-col items-center pt-16 pb-24 md:pt-28 md:pb-[150px] text-center z-10 min-h-[400px] md:min-h-[520px]"
            >
              <div className="absolute inset-0 pointer-events-none bg-group6-gradient opacity-95" />
              <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '16px 16px', backgroundPosition: 'center bottom' }} />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 via-transparent to-transparent" />

              <div className="relative z-20 flex flex-col items-center w-full px-6">
                <div className="flex flex-col items-center mb-6 md:mb-10 w-full max-w-[400px]">
                  <img src={vibeSellingLogo} alt="Vibe Selling MVP" className="h-10 md:h-[72px] w-auto drop-shadow-2xl mx-auto" />
                </div>
                <h1 className="text-white font-[700] text-3xl md:text-[36px] leading-[120%] max-w-[700px] mb-6 md:mb-10 tracking-tight">
                   bugun qanday g'olib<br/>mahsulotlar haqida gaplashamiz
                </h1>
                <div className="w-full relative px-2">
                  {renderInputBox()}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="w-full max-w-[1000px] pt-8 flex flex-col animate-fadeIn">
            <div className="flex items-center justify-center w-full mb-10 mt-4 relative">
              <div className="w-[180px] opacity-80 hover:opacity-100 transition-opacity">
                 <img src={vibeSellingLogo} alt="Vibe Selling MVP" className="w-full h-auto drop-shadow-lg" />
              </div>
            </div>

            <div className="flex flex-col gap-6 font-sans">
              
              {submittedPrompt && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end mb-4">
                  <div className="bg-[#1C2333] border border-white/10 px-5 py-4 rounded-[20px] rounded-tr-[4px] max-w-[80%] flex flex-col gap-3 shadow-lg">
                     {imagePreview && (
                        <div className="w-[120px] h-[120px] rounded-xl overflow-hidden border border-white/10">
                           <img src={imagePreview} alt="Uploaded text reference" className="w-full h-full object-cover" />
                        </div>
                     )}
                     <p className="text-[#E2E8F0] text-[15px] leading-relaxed">{submittedPrompt}</p>
                     
                     {/* Display Active Mode chip */}
                     <div className="flex items-center gap-1.5 mt-2 bg-black/30 border border-white/5 w-fit px-2.5 py-1 rounded-md">
                        <Activity size={10} className="text-[#89E4FF]" />
                        <span className="text-[10px] uppercase tracking-wide text-white/50">{activeMode.replace('-', ' ')}</span>
                     </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-start">
                  <div className="flex gap-3 md:gap-4 max-w-[95%] md:max-w-[80%]">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 flex-shrink-0 mt-1">
                      !
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 p-3 md:p-4 rounded-[16px] md:rounded-[20px] rounded-tl-[4px] text-red-200 text-xs md:text-sm shadow-md">
                      {error}
                    </div>
                  </div>
                </motion.div>
              )}

              {loading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start w-full">
                  <div className="flex gap-2 md:gap-4 w-full">
                    <div className="w-8 h-8 rounded-full bg-[#1497F3]/20 flex items-center justify-center border border-[#1497F3]/40 flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(20,151,243,0.3)]">
                      <Sparkles size={14} className="text-[#2EC8FF] animate-pulse" />
                    </div>
                    <div className="flex-1 max-w-[1000px] w-[calc(100%-40px)] flex flex-col gap-6">
                       <div className="bg-[#111827] border border-white/10 rounded-[24px] p-6 shadow-2xl relative overflow-hidden group">
                          {/* Animated Shimmer */}
                          <div className="absolute inset-0 block pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer -translate-x-[100%] z-0" />
                          
                          <div className="relative z-10 w-1/3 h-8 bg-white/5 rounded-lg mb-4"></div>
                          <div className="relative z-10 flex gap-2 mb-8">
                             <div className="w-20 h-6 bg-white/5 rounded"></div>
                             <div className="w-20 h-6 bg-white/5 rounded"></div>
                          </div>

                          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                             <div className="h-24 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden"><div className="absolute inset-0 bg-white/5 animate-pulse" /></div>
                             <div className="h-24 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden"><div className="absolute inset-0 bg-white/5 animate-pulse delay-75" /></div>
                             <div className="h-24 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden"><div className="absolute inset-0 bg-white/5 animate-pulse delay-150" /></div>
                             <div className="h-24 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden"><div className="absolute inset-0 bg-white/5 animate-pulse delay-200" /></div>
                          </div>

                          <div className="relative z-10 grid md:grid-cols-2 gap-6">
                            <div className="h-40 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden"><div className="absolute inset-0 bg-white/5 animate-pulse delay-[50ms]" /></div>
                            <div className="h-40 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden"><div className="absolute inset-0 bg-white/5 animate-pulse delay-[100ms]" /></div>
                          </div>
                          
                          {/* Step UI overlay */}
                          <div className="absolute bottom-6 right-6 flex items-center gap-3 bg-[#0A0D12]/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 shadow-lg z-20">
                            <Loader2 size={16} className="text-[#1497F3] animate-spin" />
                            <span className="text-[#89E4FF] text-sm font-medium animate-pulse">{loadingSteps[loadingStepIdx]}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {result && result.data && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start w-full">
                  <div className="flex gap-2 md:gap-4 w-full">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#7B4DFF] to-[#1497F3] flex items-center justify-center shadow-lg border border-white/20 flex-shrink-0 mt-1">
                      <Sparkles size={12} className="text-white md:w-3.5 md:h-3.5" />
                    </div>
                    <div className="flex-1 max-w-[1000px] w-[calc(100%-40px)] flex flex-col gap-6" id="report-container">
                        
                        <div className="flex justify-end px-2 gap-2" data-html2canvas-ignore="true">
                          <button onClick={handleSaveReport} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10">
                            <Bookmark size={14} /> Save Report
                          </button>
                          <div className="flex relative">
                             <button onClick={() => setDownloadMenuOpen(!downloadMenuOpen)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10">
                               <Download size={14} /> Download Report <ChevronDown size={14} className="opacity-70" />
                             </button>
                             {downloadMenuOpen && (
                               <div className="absolute right-0 top-[110%] w-40 bg-[#1A2333] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col">
                                 <button onClick={() => { handleDownloadPDF(); setDownloadMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm text-white/90 border-b border-white/5 flex items-center gap-2">
                                   <FileText size={14} /> Download PDF
                                 </button>
                                 <button onClick={() => { handleDownloadCSV(); setDownloadMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm text-white/90 flex items-center gap-2">
                                   <Download size={14} /> Download CSV
                                 </button>
                               </div>
                             )}
                          </div>
                        </div>

                        {result.mode === 'winning-product' && <WinningProductView data={result.data as any} />}
                        {result.mode === 'trending-products' && <TrendingProductsView data={result.data as any} />}
                        {result.mode === 'competitor-spy' && <CompetitorSpyView data={result.data as any} />}
                        {result.mode === 'ad-analyzer' && <AdAnalyzerView data={result.data as any} />}

                        {/* Rendering Web Search sources if available */}
                        {result.sources && result.sources.length > 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-[#111827] border border-white/10 rounded-[20px] p-5 text-left shadow-xl mt-4">
                            <h3 className="text-[11px] font-semibold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <Search size={14} /> Web qidiruv natijalari
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {result.sources.map((url, i) => {
                                try {
                                  const domain = new URL(url).hostname.replace('www.', '');
                                  return (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/70 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors border border-white/5">
                                      <LinkIcon size={12} /> {domain}
                                    </a>
                                  );
                                } catch { return null; }
                              })}
                            </div>
                          </motion.div>
                        )}

                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      {isChatMode && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#03060B] via-[#03060B]/90 to-transparent z-40 pointer-events-none">
          <div className="pointer-events-auto">
            {renderInputBox()}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0A0D12]/80 backdrop-blur-sm">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="w-full max-w-sm bg-[#111827] border border-red-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500 pointer-events-none">
                  <Flame size={64} />
               </div>
               <h3 className="text-xl font-bold text-white mb-2 relative z-10">Hisobingizdagi kreditlar tugadi</h3>
               <p className="text-white/60 text-sm mb-6 relative z-10">Afsuski, bu tahlilni amalga oshirish uchun yetarli kredit mavjud emas.</p>
               
               <div className="flex flex-col gap-3 relative z-10">
                 <button onClick={() => { setShowUpgradeModal(false); onNavigateToPricing && onNavigateToPricing(); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#1497F3] to-[#7B4DFF] text-white font-semibold">
                    Kredit sotib olish
                 </button>
                 <button onClick={() => { setShowUpgradeModal(false); onNavigateToPricing && onNavigateToPricing(); }} className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10">
                    Tariflarni ko'rish
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}