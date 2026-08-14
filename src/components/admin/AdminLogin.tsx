import React, { useState } from 'react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Lock, User, Key, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '../../i18n';

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const snap = await getDoc(doc(db, 'app_settings', 'admin_auth'));
      const data = snap.exists() ? snap.data() : {};
      
      const expectedUser = data.username || (import.meta as any).env?.VITE_ADMIN_USER || 'davlati';
      const expectedPin = data.pin || (import.meta as any).env?.VITE_ADMIN_PIN || '2009';

      if (username === expectedUser && pin === expectedPin) {
        onLogin();
      } else {
        setError(t('admin.invalidLogin'));
      }
    } catch (err: any) {
      setError(t('common.error') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0D12] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1497F3]/10 to-transparent opacity-50" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0A1322]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1497F3] to-[#89E4FF] flex items-center justify-center shadow-lg">
            <Lock className="text-white" size={32} />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-white mb-2">{t('admin.loginTitle')}</h1>
        <p className="text-center text-white/50 mb-8">Savdolab</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">{t('admin.username')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-white/40" />
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-[#1497F3] text-white transition-colors"
                placeholder={t('admin.username')}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">PIN</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Key size={18} className="text-white/40" />
              </div>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-[#1497F3] text-white transition-colors tracking-widest"
                placeholder="••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[#1497F3] hover:bg-[#2081C3] text-white font-bold rounded-xl py-3.5 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(20,151,243,0.3)] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <span className="flex items-center gap-2">{t('admin.login')} <ArrowRight size={18} /></span>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
