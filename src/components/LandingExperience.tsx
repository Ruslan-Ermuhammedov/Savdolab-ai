import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Search, Megaphone, Play, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Pricing from './Pricing';

export default function LandingExperience({ onNavigateToPricing }: { onNavigateToPricing?: () => void }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'app_settings', 'landing'));
        if (snap.exists()) {
          setConfig(snap.data());
        }
      } catch (err) {
        console.error('Failed to load landing config', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  if (loading) {
    return <div className="w-full py-20 flex justify-center"><div className="animate-pulse w-10 h-10 bg-white/10 rounded-full" /></div>;
  }

  // Default configuration if missing (these mimic the requirement)
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

  const current = config || defaultConf;

  const IconMap: Record<string, any> = {
    Sparkles, Flame, Search, Megaphone
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-24 mt-8">
      {/* Logos Section */}
      {current.logos?.enabled !== false && (
        <section className="flex flex-col items-center opacity-70">
          <p className="tracking-widest text-[10px] uppercase font-bold text-white/50 mb-6 font-mono">Trusted by Top Sellers on</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center">
             {(current.logos?.items || defaultConf.logos.items).map((logo: string, idx: number) => (
                <div key={idx} className="text-white/60 font-medium text-lg md:text-xl tracking-tight grayscale hover:grayscale-0 hover:text-white transition-all">{logo}</div>
             ))}
          </div>
        </section>
      )}

      {/* Featured AI Tools */}
      <section className="flex flex-col gap-8 w-full">
        <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight">Feature-Rich AI Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(current.features || defaultConf.features).map((feature: any) => {
             if (!feature.enabled) return null;
             const Icon = IconMap[feature.icon] || Sparkles;
             return (
               <div key={feature.id} className="bg-[#0A1322] border border-white/10 rounded-[24px] p-6 flex flex-col items-start hover:bg-[#111A2B] transition-colors relative overflow-hidden group">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-[#1497F3] group-hover:scale-110 transition-transform">
                   <Icon size={24} />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                 <p className="text-white/60 text-sm leading-relaxed mb-6 flex-1">{feature.desc}</p>
                 <div className="text-xs text-[#89E4FF] font-medium leading-loose border-l-2 border-[#1497F3] pl-3 mb-6">
                    {feature.highlights.split(' • ').map((h: string, i: number) => (
                       <div key={i}>{h}</div>
                    ))}
                 </div>
                 <button className="text-sm font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 w-full py-3 rounded-xl transition-colors">
                   Try Now
                 </button>
               </div>
             )
          })}
        </div>
      </section>

      {/* Trending Showcase */}
      {(current.trending?.enabled !== false) && (current.trending?.products?.length > 0) && (
        <section className="flex flex-col gap-8 w-full">
           <div className="flex flex-col items-center mb-2">
             <div className="flex items-center gap-2 text-[#FF4500] bg-[#FF4500]/10 border border-[#FF4500]/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                <Flame size={14} className="animate-pulse" /> Trending Now
             </div>
             <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight">Top Products to Sell</h2>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {(current.trending.products || defaultConf.trending.products).map((p: any) => (
                 <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(20,151,243,0.15)] transition-all group">
                    <div className="h-48 w-full relative overflow-hidden bg-black/40">
                       <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                       <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 text-xs font-bold text-white flex items-center gap-1">
                          <Sparkles size={12} className="text-[#89E4FF]" /> Score: {p.score}
                       </div>
                       <div className="absolute top-3 right-3 bg-green-500/20 backdrop-blur-md px-2 py-1 rounded border border-green-500/30 text-xs font-bold text-green-400">
                          {p.growth}
                       </div>
                    </div>
                    <div className="p-5">
                       <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-2">{p.category}</div>
                       <h4 className="text-white font-bold leading-tight line-clamp-2">{p.name}</h4>
                    </div>
                 </div>
              ))}
           </div>
        </section>
      )}

      {/* Video Demo */}
      {current.video?.enabled && (
        <section className="flex flex-col items-center w-full max-w-[900px] mx-auto">
           <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-8">See it in Action</h2>
           <div className="w-full aspect-video rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative bg-black/50 group">
             {current.video.url ? (
               <iframe className="w-full h-full" src={current.video.url} title="Video Demo" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
             ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-20 h-20 rounded-full bg-[#1497F3]/20 flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer border border-[#1497F3]/40">
                      <Play className="text-[#1497F3] fill-[#1497F3] translate-x-1" size={32} />
                   </div>
                </div>
             )}
           </div>
        </section>
      )}

      {/* Why Use */}
      <section className="flex flex-col gap-8 w-full">
         <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-2">Why Sellers Use Savdolab</h2>
         <div className="flex flex-wrap justify-center gap-4">
            {(current.whyUse?.cards || defaultConf.whyUse.cards).map((card: any, idx: number) => (
              <div key={idx} className="bg-black/30 border border-white/10 rounded-2xl px-6 py-5 max-w-[300px] flex-1 min-w-[250px]">
                 <CheckCircle2 size={24} className="text-[#1497F3] mb-4" />
                 <h4 className="text-white font-bold text-lg mb-2">{card.title}</h4>
                 <p className="text-white/60 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
         </div>
      </section>

      {/* Comparison */}
      {(current.comparison?.enabled !== false) && (
        <section className="flex flex-col gap-10 w-full max-w-[800px] mx-auto">
           <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-2">The Unfair Advantage</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-500/5 border border-red-500/20 rounded-[24px] p-8">
                 <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Manual Research</h3>
                 <ul className="flex flex-col gap-4">
                   {(current.comparison?.manual || defaultConf.comparison.manual).map((t: string, i: number) => (
                     <li key={i} className="flex gap-3 text-white/70 items-start">
                        <span className="text-red-400 font-bold mt-0.5">✕</span> {t}
                     </li>
                   ))}
                 </ul>
              </div>
              <div className="bg-[#1497F3]/10 border border-[#1497F3]/30 rounded-[24px] p-8 shadow-[0_0_40px_rgba(20,151,243,0.1)] relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={100} /></div>
                 <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Savdolab AI</h3>
                 <ul className="flex flex-col gap-4 relative z-10">
                   {(current.comparison?.savdolab || defaultConf.comparison.savdolab).map((t: string, i: number) => (
                     <li key={i} className="flex gap-3 text-white justify-start items-start">
                        <CheckCircle2 size={18} className="text-[#1497F3] mt-0.5" /> <span className="font-semibold">{t}</span>
                     </li>
                   ))}
                 </ul>
              </div>
           </div>
        </section>
      )}

      {/* Success Metrics */}
      <section className="py-12 border-y border-white/10 w-full">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-[1000px] mx-auto justify-items-center">
            {(current.metrics?.stats || defaultConf.metrics.stats).map((stat: any, idx: number) => (
               <div key={idx} className="flex flex-col items-center">
                 <div className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 mb-2">{stat.value}</div>
                 <div className="text-sm font-semibold tracking-wider text-[#1497F3] uppercase">{stat.label}</div>
               </div>
            ))}
         </div>
      </section>

      {/* Testimonials */}
      {(current.testimonials?.enabled !== false) && (current.testimonials?.items?.length > 0) && (
        <section className="flex flex-col gap-8 w-full">
           <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-4">Success Stories</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {current.testimonials.items.map((testi: any, idx: number) => (
                 <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <div className="flex gap-1 mb-4 text-yellow-400">{'★'.repeat(5)}</div>
                    <p className="text-white/80 italic mb-6">"{testi.review}"</p>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1497F3] to-[#89E4FF] p-0.5">
                          <div className="w-full h-full rounded-full bg-[#0A1322] flex items-center justify-center text-white font-bold">{testi.name?.[0]}</div>
                       </div>
                       <div>
                          <div className="font-bold text-white text-sm">{testi.name}</div>
                          <div className="text-xs text-white/50">{testi.role}, {testi.company}</div>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </section>
      )}

      {/* Pricing Preview */}
      <section className="flex flex-col gap-8 w-full items-center">
         <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-2">Simple, Transparent Pricing</h2>
         <p className="text-white/60 text-center mb-6">Choose the perfect plan for your business scale</p>
         <div className="w-full pointer-events-none scale-90 md:scale-100 origin-top">
            {/* We reuse the styling of pricing but block interactions to lead them to specific page later if needed, or allow interactions.
                Requirement: "Pricing pulled dynamically from pricing system." */}
            <Pricing user={null} onShowToast={() => {}} onNavigateToProfile={() => {}} hideHeader={true} />
         </div>
         {onNavigateToPricing && (
            <button onClick={onNavigateToPricing} className="mt-8 px-8 py-4 bg-[#1497F3] hover:bg-[#2081C3] text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(20,151,243,0.4)] transition-all">
               View Full Pricing Options
            </button>
         )}
      </section>

      {/* Upgrade Banner */}
      {current.upgradeBanner?.enabled && (
         <div className="w-full max-w-[800px] mx-auto bg-gradient-to-r from-[#1497F3]/20 via-[#89E4FF]/10 to-[#1497F3]/20 border border-[#1497F3]/30 rounded-[32px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10">
               <h3 className="text-2xl md:text-3xl font-black text-white mb-2">{current.upgradeBanner.text}</h3>
               <p className="text-[#89E4FF] font-medium">Unlock all premium AI capabilities today.</p>
            </div>
            <button onClick={onNavigateToPricing} className="relative z-10 whitespace-nowrap px-8 py-4 bg-white text-[#0A1322] font-black rounded-full hover:scale-105 transition-transform shadow-xl">
               {current.upgradeBanner.btnText}
            </button>
         </div>
      )}

      {/* FAQ */}
      {(current.faq?.enabled !== false) && (
         <section className="flex flex-col gap-8 w-full max-w-[800px] mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-4">Frequently Asked Questions</h2>
            <div className="flex flex-col gap-4">
               {(current.faq?.items || defaultConf.faq.items).map((faq: any, idx: number) => {
                  const isOpen = expandedFaq === idx;
                  return (
                     <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <button onClick={() => setExpandedFaq(isOpen ? null : idx)} className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors">
                           <span className="font-bold text-white text-lg pr-4">{faq.q}</span>
                           {isOpen ? <ChevronUp className="text-white/50" /> : <ChevronDown className="text-white/50" />}
                        </button>
                        {isOpen && (
                           <div className="px-6 pb-6 pt-2 text-white/70 leading-relaxed border-t border-white/5 mx-6">
                              {faq.a}
                           </div>
                        )}
                     </div>
                  )
               })}
            </div>
         </section>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-white/10 pt-10 pb-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-white/50">
         <div>© {new Date().getFullYear()} Savdolab. All rights reserved.</div>
         <div className="flex flex-wrap justify-center gap-6">
            <a href={current.footer?.terms || '#'} className="hover:text-white transition-colors">Terms</a>
            <a href={current.footer?.privacy || '#'} className="hover:text-white transition-colors">Privacy</a>
            <a href={current.footer?.support || '#'} className="hover:text-white transition-colors">Support</a>
            <a href={current.footer?.contact || '#'} className="hover:text-white transition-colors">Contact</a>
            <a href={current.footer?.telegram || '#'} className="text-[#1497F3] hover:text-[#89E4FF] transition-colors font-medium">Telegram</a>
         </div>
      </footer>
    </div>
  );
}
