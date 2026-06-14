import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { X, Gift, ArrowRight } from 'lucide-react';

interface SpinWheelProps {
    user: any;
    onComplete: () => void;
}

export default function SpinWheel({ user, onComplete }: SpinWheelProps) {
    const [settings, setSettings] = useState<any>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [reward, setReward] = useState<any>(null);
    const [rotation, setRotation] = useState(0);

    const defaultRewards = [
        { label: "5 Kredit", type: "credits", value: 5, color: "#1497F3", probability: 0.15 },
        { label: "10 Kredit", type: "credits", value: 10, color: "#7B4DFF", probability: 0.15 },
        { label: "15 Kredit", type: "credits", value: 15, color: "#F31477", probability: 0.1 },
        { label: "20 Kredit", type: "credits", value: 20, color: "#F3A914", probability: 0.05 },
        { label: "1 BePul WP Tahlil", type: "credits", value: 4, color: "#14F3A9", probability: 0.2 },
        { label: "1 BePul TH Tahlil", type: "credits", value: 8, color: "#9A14F3", probability: 0.15 },
        { label: "20% Chegirma", type: "coupon", value: "WELCOME20", color: "#F34D14", probability: 0.15 },
        { label: "24S Pro Tarif", type: "pro_access", value: 24, color: "#4D14F3", probability: 0.05 },
    ];

    const [rewards, setRewards] = useState(defaultRewards);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const s = await getDoc(doc(db, 'app_settings', 'spin_wheel'));
                if (s.exists()) {
                    setSettings(s.data());
                    if (s.data().rewards && s.data().rewards.length > 0) {
                        setRewards(s.data().rewards);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchSettings();
    }, []);

    const handleSpin = async () => {
        if (isSpinning || reward) return;
        setIsSpinning(true);

        // Determine reward based on probabilities
        const rand = Math.random();
        let cumulative = 0;
        let selectedIndex = 0;
        for (let i = 0; i < rewards.length; i++) {
            cumulative += rewards[i].probability || (1 / rewards.length);
            if (rand <= cumulative) {
                selectedIndex = i;
                break;
            }
        }

        const selectedReward = rewards[selectedIndex];

        // Animate spin
        const sliceAngle = 360 / rewards.length;
        const targetAngle = 360 * 5 + (360 - (selectedIndex * sliceAngle)) - (sliceAngle / 2);
        
        setRotation(targetAngle);

        setTimeout(async () => {
            setReward(selectedReward);
            setIsSpinning(false);

            // Apply reward
            try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                const updates: any = { spin_completed: true };

                if (userSnap.exists()) {
                    const d = userSnap.data();
                    if (selectedReward.type === 'credits') {
                        updates.total_credits = (d.total_credits || 0) + selectedReward.value;
                    } else if (selectedReward.type === 'pro_access') {
                        updates.plan_id = 'pro';
                        updates.pro_until = Date.now() + (selectedReward.value * 3600 * 1000);
                    }
                }
                
                const batch = writeBatch(db);
                batch.update(userRef, updates);

                // Save to history
                const spinRef = doc(collection(db, 'spin_history'));
                batch.set(spinRef, {
                    userId: user.uid,
                    userEmail: user.email || '',
                    rewardId: selectedIndex,
                    rewardLabel: selectedReward.label,
                    rewardType: selectedReward.type,
                    rewardValue: selectedReward.value,
                    createdAt: Date.now()
                });

                await batch.commit();

            } catch (e) {
                console.error("Error applying reward", e);
            }
        }, 5000); // 5 seconds spin
    };

    if (settings && settings.enabled === false) {
        // If explicitly disabled by admin, complete but do nothing async? Or UI skips it.
        // Actually best to skip rendering entirely. This component will call onComplete when unmounted or inside effect.
        // But for safety:
        useEffect(() => { onComplete(); }, []);
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0f1115]/90 border border-white/10 rounded-3xl p-8 max-w-xl w-full flex flex-col items-center text-center relative overflow-hidden ring-1 ring-white/10 shadow-2xl"
            >
                {/* Decorative background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#1497F3]/20 rounded-full blur-[100px] pointer-events-none" />

                {!reward ? (
                    <>
                        <h2 className="text-3xl font-bold mb-2">Hush kelibsiz!</h2>
                        <p className="text-white/60 mb-8 max-w-sm">Tizimga ilk bor kirganingiz uchun omad g'ildiragini aylantiring va bonuslarga ega bo'ling.</p>

                        <div className="relative w-72 h-72 mb-10">
                            {/* Inner arrow indicator */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-[#1497F3]">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                                    <path d="M12 21L23.547 4.5H0.452995L12 21Z" />
                                </svg>
                            </div>

                            <div 
                                className="w-full h-full rounded-full border-4 border-white/20 relative overflow-hidden transition-transform duration-[5000ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                                style={{ transform: `rotate(${rotation}deg)` }}
                            >
                                {rewards.map((r: any, idx: number) => {
                                    const sliceAngle = 360 / rewards.length;
                                    const currentRotation = idx * sliceAngle;
                                    return (
                                        <div 
                                            key={idx}
                                            className="absolute top-0 left-0 w-full h-full"
                                            style={{
                                                clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%)',
                                                transform: `rotate(${currentRotation}deg)`,
                                                backgroundColor: r.color,
                                                transformOrigin: '50% 50%'
                                            }}
                                        >
                                            <div 
                                                className="absolute inset-0 flex items-start justify-center pt-8 text-xs font-bold text-white uppercase drop-shadow-md"
                                                style={{ transform: `rotate(${sliceAngle / 2}deg)` }}
                                            >
                                                <span className="-rotate-90 origin-bottom w-32 text-center truncate">{r.label}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Center circle */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner z-10">
                                <Gift className="text-[#1497F3]" size={28} />
                            </div>
                        </div>

                        <button 
                            onClick={handleSpin}
                            disabled={isSpinning}
                            className="px-10 py-4 bg-gradient-to-r from-[#1497F3] to-[#7B4DFF] text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(20,151,243,0.3)]"
                        >
                            {isSpinning ? 'Aylanmoqda...' : 'Omadni Sinash'}
                        </button>
                    </>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center space-y-6 pt-4 pb-2"
                    >
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: reward.color + '40', color: reward.color }}>
                            <Gift size={48} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">Tabriklaymiz!</h2>
                            <p className="text-white/60 text-lg">Siz quyidagi bonusni yutib oldingiz:</p>
                        </div>
                        
                        <div className="text-3xl font-bold p-6 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-sm w-full">
                            {reward.label}
                        </div>
                        
                        {reward.type === 'coupon' && (
                            <div className="border border-dashed border-[#1497F3] p-3 text-center rounded-xl w-full">
                                <p className="text-white/50 text-xs mb-1">Chegirma Promokodi:</p>
                                <p className="font-mono text-xl font-bold text-[#1497F3]">{reward.value}</p>
                            </div>
                        )}

                        <button 
                            onClick={onComplete}
                            className="mt-8 px-8 py-4 bg-white text-black hover:bg-gray-100 rounded-xl font-bold flex items-center gap-2 transition-colors w-full justify-center"
                        >
                            Platformaga o'tish <ArrowRight size={20} />
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
