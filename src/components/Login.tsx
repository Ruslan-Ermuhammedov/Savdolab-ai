import React, { useState, useEffect } from 'react';
import { signInWithGoogle } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn } from 'lucide-react';

const feedbacks = [
  { name: 'Otabek R.', text: "Savdolab orqali topgan mahsulotlarim Uzum'da juda zo'r sotilyapti!", rating: 5 },
  { name: 'Sanjar A.', text: "Trendlarni aniqlashda juda qulay, reklamalar haqida zo'r tahlillar beradi.", rating: 5 },
  { name: 'Malika T.', text: "Nima sotishni bilmayotgan edim, ushbu platformadan ajoyib g'oyalar topdim.", rating: 5 },
  { name: 'Javohir K.', text: "Endi raqobatchilarni o'rganish juda oson. Tahlillar juda aniq.", rating: 5 },
];

export default function Login() {
  const [currentFeedback, setCurrentFeedback] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeedback((prev) => (prev + 1) % feedbacks.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex w-full h-screen bg-[#020b16] text-white">
      {/* Left Side: Carousel */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-[#091730] to-[#0A0D12] border-r border-white/5 flex-col justify-center items-center overflow-hidden p-12">
        <div className="absolute inset-0 block pointer-events-none bg-animated-mesh opacity-30 z-0" />
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px', backgroundPosition: 'center' }} />
        
        <div className="z-10 w-full max-w-lg mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">Bozorni <span className="text-[#1497F3]">sun'iy intellekt</span> bilan boshqaring.</h1>
          <p className="text-white/60 text-lg">Savdolab yordamida qaysi mahsulot sotilishini, qanday reklama qilishni oldindan biling.</p>
        </div>

        <div className="z-10 w-full max-w-lg bg-black/30 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFeedback}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(feedbacks[currentFeedback].rating)].map((_, i) => (
                  <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="#EAB308" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                ))}
              </div>
              <p className="text-xl font-medium text-white/90 leading-relaxed italic mb-6">"{feedbacks[currentFeedback].text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1497F3] to-purple-500 flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(20,151,243,0.3)] border border-white/10">
                  {feedbacks[currentFeedback].name[0]}
                </div>
                <div>
                  <h4 className="font-semibold text-white/90">{feedbacks[currentFeedback].name}</h4>
                  <span className="text-xs text-white/50">Tadbirkor</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex gap-2 mt-8">
            {feedbacks.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentFeedback ? 'w-6 bg-[#1497F3]' : 'w-2 bg-white/20'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Login Panel */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[#000000] p-6 lg:p-12 relative">
         <div className="w-full max-w-sm flex items-center gap-3 absolute top-8 left-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1497F3] to-purple-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(20,151,243,0.4)]">
              S
            </div>
            <span className="text-xl font-black text-white tracking-tight">Savdolab</span>
         </div>
         <div className="w-full max-w-md flex flex-col items-center">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
               <LogIn className="text-[#1497F3]" size={32} />
            </div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight">Xush kelibsiz</h2>
            <p className="text-white/50 mb-10 text-center text-sm">Tizimga kirish uchun Google akkauntingizdan foydalaning va tahlillarni boshlang.</p>
            
            <button 
              onClick={handleLogin}
              className="w-full bg-white text-black hover:bg-gray-100 px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google orqali kirish
            </button>
            
            <p className="text-[11px] text-white/30 text-center mt-8 px-4">
              Tizimga kirish orqali siz platformadan foydalanish shartlariga va maxfiylik siyosatiga rozilik bildirasiz.
            </p>
         </div>
      </div>
    </div>
  );
}
