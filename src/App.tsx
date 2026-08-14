/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import AnalyzerInterface from './components/AnalyzerInterface';
import Onboarding from './components/Onboarding';
import Profile from './components/Profile';
import Pricing from './components/Pricing';
import SpinWheel from './components/SpinWheel';
import PromoBanner from './components/PromoBanner';
import SavedReports from './components/SavedReports';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useI18n } from './i18n';

export interface HistoryItem {
  id: string;
  query: string;
  mode: string;
  timestamp: Date;
}

export default function App() {
  const { language, setLanguage, t } = useI18n();
  const [taskKey, setTaskKey] = useState(0);
  const [initialQuery, setInitialQuery] = useState<string>('');
  const [initialMode, setInitialMode] = useState<string>('winning-product');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState<'analyzer' | 'profile' | 'pricing' | 'saved-reports'>('analyzer');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [isSpinCompleted, setIsSpinCompleted] = useState<boolean>(true);

  const requireAuth = (callback: () => void) => {
    if (user) {
      callback();
    } else {
      showToast(t('app.loginDisabled'));
    }
  };

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;
    import('./firebase').then(({ auth, db, handleFirestoreError, OperationType }) => {
      const unsubscribeAuto = auth.onAuthStateChanged(async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          unsubscribeSnapshot = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                if (docSnap.data().onboarding_completed) {
                   setIsOnboardingCompleted(true);
                } else {
                   setIsOnboardingCompleted(false);
                }
                setIsSpinCompleted(docSnap.data().spin_completed === true);
            }
            setAuthLoading(false);
          }, (error) => {
             setAuthLoading(false);
          });
        } else {
          setIsOnboardingCompleted(null);
          setAuthLoading(false);
        }
      });
      return () => {
         unsubscribeAuto();
         if (unsubscribeSnapshot) unsubscribeSnapshot();
      };
    });
  }, []);

  useEffect(() => {
    // Check if there was a pending action after login redirect (if standard popup/redirect used)
  }, []);

  const [sharedId, setSharedId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('shared');
    if (shared) {
       setSharedId(shared);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewTask();
        showToast(t('app.newTaskStarted'));
      }
      // Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('focusPrompt'));
        showToast(t('app.promptFocused'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [profileTab, setProfileTab] = useState('personal');

  const handleNewTask = () => {
    setCurrentRoute('analyzer');
    setInitialQuery('');
    setTaskKey(prev => prev + 1);
  };

  const handleOpenTask = (query: string, mode: string = 'winning-product') => {
    setCurrentRoute('analyzer');
    setInitialQuery(query);
    setInitialMode(mode);
    setTaskKey(prev => prev + 1);
  };

  const handleOpenProfile = (tab: string = 'personal') => {
    if (!user) {
      showToast(t('app.profileRequiresLogin'));
      return;
    }
    setProfileTab(tab);
    setCurrentRoute('profile');
  };

  const handleOpenSavedReports = () => {
    if (!user) {
      showToast(t('app.savedReportsRequireLogin'));
      return;
    }
    setCurrentRoute('saved-reports');
  };

  const handleOpenPricing = () => {
    setCurrentRoute('pricing');
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const addHistoryItem = (query: string, mode: string) => {
    setHistory(prev => {
      const newItem = { id: Date.now().toString(), query, mode, timestamp: new Date() };
      return [newItem, ...prev].slice(0, 10);
    });
  };

  if (authLoading) {
    return <div className="w-full h-screen bg-[#0A0D12] flex items-center justify-center text-white/50">{t('common.loading')}</div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden w-full bg-transparent">
      {user && isOnboardingCompleted === false && (
        <div className="fixed inset-0 z-[200] bg-[#0A0D12]">
          <Onboarding onComplete={() => setIsOnboardingCompleted(true)} />
        </div>
      )}
      <PromoBanner />
      <div className="flex flex-col md:flex-row w-full flex-1 text-white overflow-hidden bg-transparent relative">
        {!isSpinCompleted && <SpinWheel user={user} onComplete={() => setIsSpinCompleted(true)} />}
        <Sidebar onNewTask={handleNewTask} onOpenTask={handleOpenTask} onOpenProfile={handleOpenProfile} onOpenPricing={handleOpenPricing} onOpenSavedReports={handleOpenSavedReports} onShowToast={showToast} history={history} user={user} language={language} onLanguageChange={setLanguage} />
        
        {currentRoute === 'analyzer' ? (
          <AnalyzerInterface key={taskKey} initialQuery={initialQuery} initialMode={initialMode as any} sharedId={sharedId} onAnalysisComplete={addHistoryItem} user={user} onNavigateToPricing={handleOpenPricing} onShowToast={showToast} onRequireAuth={requireAuth} language={language} />
        ) : currentRoute === 'pricing' ? (
          <Pricing user={user} onShowToast={showToast} onNavigateToProfile={() => handleOpenProfile('billing')} onRequireAuth={requireAuth} />
        ) : currentRoute === 'saved-reports' ? (
          <SavedReports user={user} onShowToast={showToast} />
        ) : (
          <Profile user={user} onShowToast={showToast} onNavigateToPricing={handleOpenPricing} initialTab={profileTab} />
        )}
        
        {/* GLobal Toast */}
        <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-6 left-1/2 z-[100] bg-[#1497F3] text-white px-5 py-2.5 rounded-full font-medium shadow-[0_10px_30px_rgba(20,151,243,0.3)] text-sm"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
