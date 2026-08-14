import React from 'react';
import { motion } from 'framer-motion';
import { LogIn, X } from 'lucide-react';
import { signInWithGoogle } from '../firebase';
import { useI18n } from '../i18n';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { t } = useI18n();
  if (!isOpen) return null;

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      // App.tsx handles the onAuthStateChanged which will close this modal
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/popup-blocked') {
        setErrorMsg(t('auth.popupBlocked'));
      } else if (err?.code === 'auth/cancelled-popup-request' || err?.code === 'auth/popup-closed-by-user') {
         // User cancelled, we can ignore or just show a message.
        setErrorMsg(t('auth.cancelled'));
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMsg(t('auth.unauthorizedDomain'));
      } else {
        setErrorMsg(err?.message || t('auth.genericError'));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0A0D12] border border-white/10 rounded-2xl w-full max-w-md p-8 relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
           <X size={20} />
        </button>

        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-2xl mt-4">
           <LogIn className="text-[#1497F3]" size={32} />
        </div>
        
        <h3 className="text-2xl font-bold mb-3 text-center">{t('auth.title')}</h3>
        <p className="text-white/60 mb-8 text-center text-sm">{t('auth.subtitle')}</p>
        
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6 w-full text-center">
            {errorMsg}
          </div>
        )}

        <button 
          onClick={handleLogin}
          className="w-full bg-white text-black hover:bg-gray-100 px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-4"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t('auth.google')}
        </button>
      </motion.div>
    </div>
  );
}
