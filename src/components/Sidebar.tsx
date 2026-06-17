import React, { useState } from 'react';
import { Plus, Search, Layers, FileText, BrainCircuit, LogOut, Settings, Menu, X, Clock, CreditCard, Bookmark, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import savdolabLogo from '../Group 2 (3) 4.png';
import { HistoryItem } from '../App';
import { logOut } from '../firebase';

interface SidebarProps {
  onNewTask: () => void;
  onOpenTask: (query: string, mode?: string) => void;
  onOpenProfile: () => void;
  onOpenPricing: () => void;
  onOpenSavedReports: () => void;
  onShowToast: (msg: string) => void;
  history: HistoryItem[];
  user: any;
  language: 'uz' | 'ru' | 'en';
  onLanguageChange: (lang: 'uz' | 'ru' | 'en') => void;
}

export default function Sidebar({ onNewTask, onOpenTask, onOpenProfile, onOpenPricing, onOpenSavedReports, onShowToast, history, user, language, onLanguageChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleComingSoon = (e: React.MouseEvent) => {
    e.preventDefault();
    onShowToast("Tez kunda!");
    setIsOpen(false);
  };

  const handleNewTaskClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNewTask();
    setIsOpen(false);
  };

  const handleTaskClick = (query: string, mode: string) => {
    onOpenTask(query, mode);
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const NavigationLinks = () => (
    <>
      <div className="px-4 space-y-1">
        <button onClick={handleNewTaskClick} className="w-full flex items-center gap-3 px-3 py-2.5 text-white/65 hover:text-white/95 rounded-xl text-sm font-medium transition-colors hover:bg-white/5">
          <Plus size={16} className="opacity-70" />
          <span className="flex-1 text-left flex justify-between items-center">
            New task
            <span className="text-[10px] text-white/30 hidden md:block border border-white/10 px-1.5 rounded bg-black/20">⌘N</span>
          </span>
        </button>
        <button onClick={() => { onShowToast("Eski chatlarni izlash..."); window.dispatchEvent(new CustomEvent('focusPrompt')); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-white/65 hover:text-white/95 rounded-xl text-sm font-medium transition-colors hover:bg-white/5">
          <Search size={16} className="opacity-70" />
          <span className="flex-1 text-left flex justify-between items-center">
            Search
            <span className="text-[10px] text-white/30 hidden md:block border border-white/10 px-1.5 rounded bg-black/20">⌘K</span>
          </span>
        </button>
        <button onClick={() => { onShowToast("Fokus markazi: Trendlar, Narxlar, Raqobatchilar"); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-white/65 hover:text-white/95 rounded-xl text-sm font-medium transition-colors hover:bg-white/5">
          <Layers size={16} className="opacity-70" />
          <span className="flex-1 text-left">Skills</span>
        </button>
        <button onClick={handleComingSoon} className="w-full flex items-center gap-3 px-3 py-2.5 text-white/65 hover:text-white/95 rounded-xl text-sm font-medium transition-colors hover:bg-white/5">
          <FileText size={16} className="opacity-70" />
          <span className="flex-1 text-left">Files</span>
        </button>
        <button onClick={handleComingSoon} className="w-full flex items-center gap-3 px-3 py-2.5 text-white/65 hover:text-white/95 rounded-xl text-sm font-medium transition-colors hover:bg-white/5">
          <BrainCircuit size={16} className="opacity-70" />
          <span className="flex-1 text-left">Memory</span>
        </button>
        <button onClick={() => { onOpenSavedReports(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-white/65 hover:text-white/95 rounded-xl text-sm font-medium transition-colors hover:bg-white/5">
          <Bookmark size={16} className="opacity-70" />
          <span className="flex-1 text-left">Saved Reports</span>
        </button>
        <button onClick={() => { onOpenPricing(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-white/65 hover:text-white/95 rounded-xl text-sm font-medium transition-colors hover:bg-white/5">
          <CreditCard size={16} className="opacity-70" />
          <span className="flex-1 text-left">Pricing</span>
        </button>
      </div>
      
      <div className="mt-8 mb-2 px-7 flex items-center gap-2">
         <Clock size={12} className="text-white/40" />
         <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Recent Analysis</span>
      </div>
      <div className="px-7 space-y-1.5 flex flex-col items-stretch">
        {history.length > 0 ? history.map((item) => (
          <button key={item.id} onClick={() => handleTaskClick(item.query, item.mode)} className="flex items-center gap-2 p-2 rounded-xl border border-transparent hover:bg-white/5 transition-colors text-left group">
              <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/40">
                <FileText size={12} className="text-blue-400 opacity-80" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[13px] text-white/80 font-medium truncate">{item.query || 'Image Search'}</p>
                <div className="flex gap-2 text-[10px]">
                  <span className="text-white/40 truncate">{item.mode.replace('-', ' ')}</span>
                  <span className="text-white/30">•</span>
                  <span className="text-white/40 whitespace-nowrap">{item.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
          </button>
        )) : (
          <div className="text-[11px] text-white/30 px-2 italic">Nothing recently analyzed.</div>
        )}
      </div>

      <div className="mt-8 mb-2 px-7 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
        Templates
      </div>
      <div className="px-7 space-y-1.5 flex flex-col items-stretch">
        <button onClick={() => handleTaskClick("Elektron termos sotuvlari qanday?", "winning-product")} className="flex items-center gap-2 p-2 rounded-xl border border-transparent hover:bg-white/5 transition-colors text-left group">
            <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20">
              <FileText size={12} className="text-white/60" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[13px] text-white/80 font-medium truncate">Elektron termos haqida...</p>
              <p className="text-[10px] text-white/40">Template</p>
            </div>
        </button>
      </div>

      <div className="mt-6 px-7 mb-2 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
        Language
      </div>
      <div className="px-4 flex gap-1">
         {['uz', 'ru', 'en'].map(lang => (
           <button 
             key={lang}
             onClick={() => onLanguageChange(lang as any)}
             className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors ${language === lang ? 'bg-[#1497F3] text-white' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white/80'}`}
           >
             {lang}
           </button>
         ))}
      </div>

      <div className="p-4 mt-auto">
        {user ? (
          <div className="flex items-center justify-between text-white/65 hover:text-white/95 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors font-medium border border-white/5 group cursor-pointer" onClick={() => { onOpenProfile(); setIsOpen(false); }}>
              <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-6 h-6 rounded-full bg-[#1497F3] flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                     {user.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : user.displayName?.[0] || 'U'}
                  </div>
                  <div className="flex flex-col overflow-hidden max-w-[120px]">
                    <span className="text-sm truncate leading-tight text-white/90">{user.displayName || 'User'}</span>
                    <span className="text-[10px] truncate text-white/40">{user.email}</span>
                  </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); logOut(); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-red-400">
                <LogOut size={16} />
              </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button onClick={() => { onOpenProfile(); setIsOpen(false); }} className="w-full bg-[#1497F3] hover:bg-[#1497F3]/90 text-white px-4 py-2.5 rounded-xl font-bold transition-colors text-sm shadow-[0_0_15px_rgba(20,151,243,0.3)]">
              Tizimga kirish
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div 
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden md:flex w-64 bg-[#0A0D12] flex-col h-screen border-r border-white/5 flex-shrink-0 relative z-50"
      >
        <div className="p-7 flex items-center justify-start mb-2 mt-4 ml-1">
          <img src={savdolabLogo} alt="Savdolab" className="h-[28px] w-auto drop-shadow-md" />
        </div>
        <nav className="flex-1 flex flex-col pt-2 overflow-y-auto">
          <NavigationLinks />
        </nav>
      </motion.div>

      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 bg-[#0A0D12]/95 backdrop-blur-md border-b border-white/5 sticky top-0 z-[60] w-full">
        <img src={savdolabLogo} alt="Savdolab" className="h-[24px] w-auto drop-shadow-md" />
        <button onClick={toggleMenu} className="text-white/80 hover:text-white transition-colors p-1">
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'calc(100vh - 60px)' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-[60px] left-0 w-full bg-[#0A0D12] overflow-hidden z-50 border-b border-white/5 flex flex-col"
          >
            <nav className="flex-1 flex flex-col pt-6 overflow-y-auto pb-6">
              <NavigationLinks />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
