import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, increment } from 'firebase/firestore';
import { X, Clock, ArrowRight, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PromoBanner() {
    const [banners, setBanners] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hiddenBanners, setHiddenBanners] = useState<Set<string>>(new Set());
    const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const q = query(collection(db, 'promo_banners'), where('enabled', '==', true));
                const snap = await getDocs(q);
                const fetched: any[] = [];
                const now = Date.now();
                snap.forEach(d => {
                    const data = { id: d.id, ...d.data() } as any;
                    if ((!data.startDate || data.startDate <= now) && (!data.endDate || data.endDate >= now)) {
                        fetched.push(data);
                    }
                });
                
                setBanners(fetched);
                
                // Analytics: Track impressions
                fetched.forEach(b => {
                   try {
                       updateDoc(doc(db, 'promo_banners', b.id), { impressions: increment(1) });
                   } catch(e) {}
                });
            } catch (e) {
                console.error("Error fetching banners", e);
            }
        };
        fetchBanners();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const newTimeLeft: { [key: string]: string } = {};
            
            banners.forEach(b => {
                if (b.enableCountdown && b.endDate) {
                    const diff = b.endDate - now;
                    if (diff <= 0) {
                        setHiddenBanners(prev => new Set(prev).add(b.id)); // hide expired
                    } else {
                        const h = Math.floor(diff / (1000 * 60 * 60));
                        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        const s = Math.floor((diff % (1000 * 60)) / 1000);
                        newTimeLeft[b.id] = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    }
                }
            });
            setTimeLeft(newTimeLeft);
        }, 1000);
        return () => clearInterval(interval);
    }, [banners]);

    if (banners.length === 0) return null;

    const visibleBanners = banners.filter(b => !hiddenBanners.has(b.id));
    if (visibleBanners.length === 0) return null;

    const banner = visibleBanners[currentIndex % visibleBanners.length];

    const handleCTA = () => {
        try {
            updateDoc(doc(db, 'promo_banners', banner.id), { clicks: increment(1) });
        } catch(e) {}
        if (banner.ctaLink) {
            window.open(banner.ctaLink, '_blank');
        }
    };

    const handleCopyParam = () => {
        if (banner.promoCode) {
            navigator.clipboard.writeText(banner.promoCode);
            // Optionally could show a small copied tooltip here
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="w-full bg-gradient-to-r from-indigo-900 via-purple-900 to-[#1497F3]/80 border-b border-white/10 z-[100] relative px-4 py-2"
            >
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-sm">
                    
                    <div className="flex items-center gap-2 font-bold text-white text-center md:text-left">
                        <Tag size={16} className="text-[#14F3A9] shrink-0" />
                        <span>{banner.title}</span>
                    </div>

                    {banner.description && (
                        <div className="hidden md:block text-white/80 font-medium">
                            {banner.description}
                        </div>
                    )}

                    {banner.promoCode && (
                        <div 
                            onClick={handleCopyParam}
                            className="flex items-center gap-2 bg-black/40 hover:bg-black/60 px-3 py-1 rounded-md border border-white/20 cursor-pointer transition-colors"
                            title="Nusxa olish"
                        >
                            <span className="text-white/60 text-xs">Kod:</span>
                            <span className="font-mono font-bold text-[#14F3A9] tracking-wider">{banner.promoCode}</span>
                        </div>
                    )}

                    {banner.enableCountdown && timeLeft[banner.id] && (
                        <div className="flex items-center gap-1.5 text-white/90">
                            <Clock size={14} className="text-yellow-400" />
                            <span className="font-mono font-medium tracking-widest">{timeLeft[banner.id]}</span>
                        </div>
                    )}

                    {banner.ctaLink && (
                        <button onClick={handleCTA} className="px-4 py-1.5 bg-white text-black rounded-lg font-bold text-xs hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                            Batafsil <ArrowRight size={12} />
                        </button>
                    )}

                    <button 
                        onClick={() => setHiddenBanners(prev => new Set(prev).add(banner.id))} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 focus:outline-none text-white/60 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
