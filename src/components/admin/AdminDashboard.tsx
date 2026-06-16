import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CreditCard, Box, DollarSign, Layout, 
  Image as ImageIcon, Gift, CircleDollarSign, Bot, 
  Settings2, Bookmark, BarChart3, Bell, 
  LifeBuoy, Settings, ShieldAlert, LogOut, Loader2
} from 'lucide-react';
import { auth } from '../../firebase';

// Placeholder empty components to prevent missing imports
import AdminOverview from './views/AdminOverview';
import UserManagement from './views/UserManagement';
import PaymentManagement from './views/PaymentManagement';
import CreditManagement from './views/CreditManagement';
import PricingManagement from './views/PricingManagement';
import PromoBannerManager from './views/PromoBannerManager';
import LandingPageManager from './views/LandingPageManager';
import SpinWheelManager from './views/SpinWheelManager';
import AgentManager from './views/AgentManager';
import FeatureToggles from './views/FeatureToggles';
import SavedReportsManager from './views/SavedReportsManager';
import NotificationCenter from './views/NotificationCenter';
import SupportCenter from './views/SupportCenter';
import AnalyticsCenter from './views/AnalyticsCenter';
import SystemSettings from './views/SystemSettings';
import AuditLogs from './views/AuditLogs';

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'credits', label: 'Credits', icon: CreditCard },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'pricing', label: 'Pricing Plans', icon: CircleDollarSign },
    { id: 'landing', label: 'Landing Manager', icon: Layout },
    { id: 'banners', label: 'Promo Banners', icon: ImageIcon },
    { id: 'spinwheel', label: 'Spin Wheel', icon: Gift },
    { id: 'agents', label: 'AI Agents', icon: Bot },
    { id: 'features', label: 'Feature Toggles', icon: Settings2 },
    { id: 'reports', label: 'Saved Reports', icon: Bookmark },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'support', label: 'Support', icon: LifeBuoy },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <AdminOverview onShowToast={showToast} navigateTo={setActiveTab} />;
      case 'users': return <UserManagement onShowToast={showToast} />;
      case 'credits': return <CreditManagement onShowToast={showToast} />;
      case 'payments': return <PaymentManagement onShowToast={showToast} />;
      case 'pricing': return <PricingManagement onShowToast={showToast} />;
      case 'landing': return <LandingPageManager onShowToast={showToast} />;
      case 'banners': return <PromoBannerManager onShowToast={showToast} />;
      case 'spinwheel': return <SpinWheelManager onShowToast={showToast} />;
      case 'agents': return <AgentManager onShowToast={showToast} />;
      case 'features': return <FeatureToggles onShowToast={showToast} />;
      case 'reports': return <SavedReportsManager onShowToast={showToast} />;
      case 'analytics': return <AnalyticsCenter onShowToast={showToast} />;
      case 'notifications': return <NotificationCenter onShowToast={showToast} />;
      case 'support': return <SupportCenter onShowToast={showToast} />;
      case 'settings': return <SystemSettings onShowToast={showToast} />;
      case 'audit': return <AuditLogs onShowToast={showToast} />;
      default: return <AdminOverview onShowToast={showToast} navigateTo={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0D12] text-white">
      {/* Sidebar */}
      <div className="w-64 bg-[#0A1322] border-r border-white/5 flex flex-col h-full shrink-0">
        <div className="p-6">
          <div className="font-black text-xl tracking-tight text-white flex items-center gap-2">
            <span className="text-[#1497F3]">Savdolab</span> Admin
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id 
                  ? 'bg-[#1497F3]/10 text-[#1497F3] border border-[#1497F3]/20' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/5">
           <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors">
              <LogOut size={18} /> Logout
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 flex items-center px-8 border-b border-white/5 bg-[#0A1322]/50 backdrop-blur-md shrink-0">
          <h2 className="text-xl font-bold tracking-tight capitalize">
            {navItems.find(i => i.id === activeTab)?.label}
          </h2>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-8 custom-scrollbar">
          {renderContent()}
        </main>
        
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              className="fixed bottom-6 left-1/2 z-[100] bg-[#1497F3] text-white px-5 py-3 rounded-xl font-medium shadow-[0_10px_30px_rgba(20,151,243,0.3)] text-sm whitespace-nowrap"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
