import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useI18n } from '../i18n';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [occupation, setOccupation] = useState('');
  const [hasStore, setHasStore] = useState<boolean | null>(null);
  const [storeName, setStoreName] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState('');
  const [mainGoals, setMainGoals] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleNext = () => setStep(prev => prev + 1);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        onboarding_completed: true,
        occupation,
        has_store: hasStore,
        store_name: storeName,
        platforms,
        team_size: teamSize,
        main_goals: mainGoals,
        total_credits: 50,
        used_credits: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlatform = (platform: string) => {
    setPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]);
  };

  const toggleGoal = (goal: string) => {
    setMainGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const occupationOptions = [
    { value: 'Marketplace seller', label: t('onboarding.options.seller') },
    { value: 'Dropshipper', label: t('onboarding.options.dropshipper') },
    { value: 'Store owner', label: t('onboarding.options.owner') },
    { value: 'Marketing agency', label: t('onboarding.options.agency') },
    { value: 'Beginner entrepreneur', label: t('onboarding.options.beginner') },
  ];

  const platformOptions = [
    { value: 'Uzum', label: 'Uzum' },
    { value: 'Yandex Market', label: 'Yandex Market' },
    { value: 'Ozon', label: 'Ozon' },
    { value: 'Wildberries', label: 'Wildberries' },
    { value: 'Shopify', label: 'Shopify' },
    { value: 'TikTok Shop', label: 'TikTok Shop' },
    { value: 'Other', label: t('common.none') },
  ];

  const teamOptions = [
    { value: 'Faqat men', label: t('onboarding.options.onlyMe') },
    { value: '2-5', label: '2-5' },
    { value: '6-10', label: '6-10' },
    { value: '11-50', label: '11-50' },
    { value: '50+', label: '50+' },
  ];

  const goalOptions = [
    { value: 'Winning products topish', label: t('onboarding.options.products') },
    { value: 'Trendlarni kuzatish', label: t('onboarding.options.trends') },
    { value: 'Raqobatchilarni analiz qilish', label: t('onboarding.options.competitors') },
    { value: 'Reklamalarni yaxshilash', label: t('onboarding.options.ads') },
    { value: 'Savdoni oshirish', label: t('onboarding.options.sales') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020b16] text-white p-4">
      <div className="w-full max-w-xl bg-black/40 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`h-1.5 rounded-full flex-1 transition-colors ${step >= i ? 'bg-[#1497F3]' : 'bg-white/20'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold mb-6">{t('onboarding.occupationTitle')}</h2>
              <div className="space-y-3">
                {occupationOptions.map(opt => (
                  <button key={opt.value} onClick={() => setOccupation(opt.value)} className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${occupation === opt.value ? 'border-[#1497F3] bg-[#1497F3]/10' : 'border-white/10 hover:bg-white/5'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={handleNext} disabled={!occupation} className="bg-white text-black px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50">{t('onboarding.next')}</button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold mb-6">{t('onboarding.hasStoreTitle')}</h2>
              <div className="space-y-3">
                <button onClick={() => setHasStore(true)} className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${hasStore === true ? 'border-[#1497F3] bg-[#1497F3]/10' : 'border-white/10 hover:bg-white/5'}`}>{t('common.yes')}</button>
                <button onClick={() => setHasStore(false)} className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${hasStore === false ? 'border-[#1497F3] bg-[#1497F3]/10' : 'border-white/10 hover:bg-white/5'}`}>{t('common.no')}</button>
              </div>
              <div className="mt-8 flex justify-between">
                 <button onClick={() => setStep(1)} className="text-white/60 hover:text-white px-4 py-2">{t('common.back')}</button>
                <button onClick={handleNext} disabled={hasStore === null} className="bg-white text-black px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50">{t('onboarding.next')}</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold mb-6">{t('onboarding.storeNameTitle')}</h2>
              <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder={t('onboarding.storeNamePlaceholder')} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#1497F3] transition-colors" />
              <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(2)} className="text-white/60 hover:text-white px-4 py-2">{t('common.back')}</button>
                <button onClick={handleNext} className="bg-white text-black px-6 py-2.5 rounded-xl font-semibold">{t('onboarding.next')}</button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold mb-6">{t('onboarding.platformsTitle')}</h2>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {platformOptions.map(opt => (
                  <button key={opt.value} onClick={() => togglePlatform(opt.value)} className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${platforms.includes(opt.value) ? 'border-[#1497F3] bg-[#1497F3]/10' : 'border-white/10 hover:bg-white/5'}`}>
                    <div className="flex items-center justify-between">
                      <span>{opt.label}</span>
                      {platforms.includes(opt.value) && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 13L9 17L19 7" stroke="#1497F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(3)} className="text-white/60 hover:text-white px-4 py-2">{t('common.back')}</button>
                <button onClick={handleNext} disabled={platforms.length === 0} className="bg-white text-black px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50">{t('onboarding.next')}</button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold mb-6">{t('onboarding.teamSizeTitle')}</h2>
              <div className="space-y-3">
                {teamOptions.map(opt => (
                  <button key={opt.value} onClick={() => setTeamSize(opt.value)} className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${teamSize === opt.value ? 'border-[#1497F3] bg-[#1497F3]/10' : 'border-white/10 hover:bg-white/5'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(4)} className="text-white/60 hover:text-white px-4 py-2">{t('common.back')}</button>
                <button onClick={handleNext} disabled={!teamSize} className="bg-white text-black px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50">{t('onboarding.next')}</button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold mb-6">{t('onboarding.goalsTitle')}</h2>
              <div className="space-y-3">
                {goalOptions.map(opt => (
                  <button key={opt.value} onClick={() => toggleGoal(opt.value)} className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${mainGoals.includes(opt.value) ? 'border-[#1497F3] bg-[#1497F3]/10' : 'border-white/10 hover:bg-white/5'}`}>
                    <div className="flex items-center justify-between">
                      <span>{opt.label}</span>
                      {mainGoals.includes(opt.value) && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 13L9 17L19 7" stroke="#1497F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(5)} className="text-white/60 hover:text-white px-4 py-2">{t('common.back')}</button>
                <button onClick={handleSave} disabled={mainGoals.length === 0 || isSaving} className="bg-[#1497F3] text-white px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50">
                  {isSaving ? t('common.saving') : t('onboarding.finish')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
