import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Plus, Trash, Save } from 'lucide-react';

export default function LandingManager({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const defaultConf = {
    features: [
      { id: '1', icon: 'Sparkles', title: 'Winning Product Finder', desc: 'Find high-margin products with low competition in seconds.', highlights: 'Real-time data • Margin calculator • Supplier links', enabled: true },
      { id: '2', icon: 'Flame', title: 'Trend Hunter', desc: 'Spot viral trends before they hit the mainstream market.', highlights: 'TikTok trends • Google search data • Rising niches', enabled: true },
      { id: '3', icon: 'Search', title: 'Competitor Spy', desc: 'Reverse engineer your competitors successful stores.', highlights: 'Ad library access • Traffic sources • Top products', enabled: true },
      { id: '4', icon: 'Megaphone', title: 'Ad Analyzer', desc: 'Generate high-converting ad copy and creatives instantly.', highlights: 'AI copywriting • Image generation • Split testing', enabled: true }
    ],
    trending: { enabled: true, products: [
       { id: '1', name: 'Smart Wireless Earbuds', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=300&auto=format&fit=crop', score: 98, growth: '+142%', category: 'Electronics' },
       { id: '2', name: 'Portable Mini Blender', image: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=300&auto=format&fit=crop', score: 95, growth: '+89%', category: 'Home & Kitchen' },
       { id: '3', name: 'Posture Corrector', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=300&auto=format&fit=crop', score: 91, growth: '+210%', category: 'Health' },
       { id: '4', name: 'Pet Hair Remover', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=300&auto=format&fit=crop', score: 88, growth: '+65%', category: 'Pets' }
    ] },
    whyUse: { enabled: true, cards: [
        { title: 'Save Time', desc: 'Automate product research and save hundreds of hours.' },
        { title: 'Find Winning Products', desc: 'Data-driven insights to pick winners with confidence.' },
        { title: 'Analyze Competition', desc: 'Stay one step ahead by tracking competitor moves.' },
        { title: 'Improve Ads', desc: 'Generate stunning ad materials that convert.' },
        { title: 'Increase Revenue', desc: 'Scale your store faster with proven data.' }
    ]},
    metrics: { enabled: true, stats: [
        { value: '10M+', label: 'Products Analyzed' },
        { value: '500K+', label: 'Reports Generated' },
        { value: '50K+', label: 'Active Users' },
        { value: '1M+', label: 'Saved Hours' }
    ]},
    testimonials: { enabled: true, items: [
       { name: 'Alex M.', role: 'E-commerce Owner', company: 'TrendStore', review: 'Savdolab completely changed how I find products. What used to take days now takes minutes.' },
       { name: 'Sarah K.', role: 'Dropshipper', company: 'Global Finds', review: 'The competitor spy tool alone is worth 10x the price. I found my most profitable product using it.' },
       { name: 'Jamshid', role: 'Store Manager', company: 'Uzum Seller', review: 'Amazing insights for the local market. The ad copy generator saves us so much money on copywriters.' }
    ] },
    video: { enabled: true, url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    comparison: { enabled: true, manual: ['Hours of research', 'Guessing what works', 'Wasting ad spend', 'Manual competitor tracking'], savdolab: ['Instant insights', 'Data-backed decisions', 'Optimized ad scaling', 'Automated spying'] },
    faq: { enabled: true, items: [
        { q: 'How does it work?', a: 'Savdolab uses advanced AI and machine learning to analyze millions of data points...' },
        { q: 'Is there a free trial?', a: 'Yes! We offer a free plan to get you started.' }
    ]},
    upgradeBanner: { enabled: true, text: 'Limited Time Offer: Get 50% off your first month!', btnText: 'Upgrade Now', link: '#' },
    logos: { enabled: true, items: ['Uzum', 'Yandex Market', 'Ozon', 'Wildberries', 'Shopify', 'TikTok Shop'] },
    footer: { terms: '#', privacy: '#', support: '#', contact: '#', telegram: '#' }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'app_settings', 'landing'));
        if (snap.exists()) {
          setConfig({ ...defaultConf, ...snap.data() });
        } else {
          setConfig(defaultConf);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
     try {
       await setDoc(doc(db, 'app_settings', 'landing'), config);
       onShowToast("Landing sozlamalari saqlandi");
     } catch (e: any) {
       onShowToast("Xatolik: " + e.message);
     }
  };

  if (loading) return <div>Loyging...</div>;

  return (
    <div className="space-y-8 bg-white/5 border border-[#1497F3]/30 rounded-2xl p-6">
       <div className="flex justify-between items-center bg-black/30 p-4 rounded-xl border border-white/10">
          <h2 className="text-xl font-bold">Landing Manger (JSON tahrirlash)</h2>
          <button onClick={handleSave} className="flex items-center gap-2 bg-[#1497F3] hover:bg-[#1497F3]/80 px-4 py-2 rounded-lg font-bold transition-colors">
            <Save size={16} /> Saqlash
          </button>
       </div>
       <div className="w-full">
         <p className="text-white/50 text-sm mb-2">Barcha seksiyalar malumotlarini JSON orqali to'la tahrirlash (tezkor usul)</p>
         <textarea 
            value={JSON.stringify(config, null, 2)}
            onChange={(e) => {
               try {
                 const updated = JSON.parse(e.target.value);
                 setConfig(updated);
               } catch(err) {
                 // ignore parsing errors while typing
               }
            }}
            className="w-full h-[600px] bg-black/50 border border-white/20 rounded-xl p-4 font-mono text-sm text-[#89E4FF] focus:outline-none focus:border-[#1497F3]"
         />
       </div>
    </div>
  );
}
