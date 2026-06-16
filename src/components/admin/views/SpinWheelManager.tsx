import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

export default function SpinWheelManager({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [settings, setSettings] = useState<any>({ enabled: true, rewards: [] });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jsonText, setJsonText] = useState("");

  const defaultRewards = [
     { id: '1', type: 'credits', value: 200, label: '200 Credits', color: '#FF4500', probability: 30 },
     { id: '2', type: 'plan', value: 'starter', label: 'Starter Plan (7 kun)', color: '#FFD700', probability: 5 },
     { id: '3', type: 'credits', value: 50, label: '50 Credits', color: '#1E90FF', probability: 40 },
     { id: '4', type: 'nothing', value: 0, label: 'Nothing', color: '#808080', probability: 10 },
     { id: '5', type: 'credits', value: 1000, label: '1000 Credits', color: '#32CD32', probability: 2 },
     { id: '6', type: 'credits', value: 100, label: '100 Credits', color: '#8A2BE2', probability: 13 }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'app_settings', 'spin_wheel'));
      let currentSettings = snap.exists() ? snap.data() : { enabled: true, rewards: defaultRewards };
      setSettings(currentSettings);
      setJsonText(JSON.stringify(currentSettings.rewards, null, 2));

      const histSnap = await getDocs(collection(db, 'spin_history'));
      const histData: any[] = [];
      histSnap.forEach(d => histData.push({ id: d.id, ...d.data() }));
      setHistory(histData.sort((a,b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.error(err);
      onShowToast("Failed to load spin wheel settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
     try {
        let parsed;
        try {
           parsed = JSON.parse(jsonText);
        } catch(e) {
           onShowToast("Invalid JSON format");
           return;
        }

        const newSettings = { ...settings, rewards: parsed };
        await setDoc(doc(db, 'app_settings', 'spin_wheel'), newSettings);
        
        await setDoc(doc(collection(db, 'audit_logs')), {
           admin: 'Admin',
           action: `Updated spin wheel settings`,
           target: 'SpinWheel',
           timestamp: new Date()
        });

        setSettings(newSettings);
        onShowToast("Spin wheel settings saved");
     } catch (err: any) {
        onShowToast("Error: " + err.message);
     }
  };

  const getStatsText = () => {
     if (!history.length) return "Noma'lum";
     const counts = history.reduce((acc, h) => {
        acc[h.rewardLabel] = (acc[h.rewardLabel] || 0) + 1;
        return acc;
     }, {} as Record<string, number>);
     const max = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0];
     return `${max[0]} (${max[1]}x)`;
  };

  if (loading) return <div className="text-white/50">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold">Spin Wheel Manager</h2>
      
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
         <div className="flex justify-between items-center">
            <h4 className="font-bold">Spin Wheel Status</h4>
            <label className="flex items-center gap-2 cursor-pointer bg-black/40 px-4 py-2 rounded-xl border border-white/10">
               <span className="text-sm font-medium">{settings.enabled ? 'Active (Visible to users)' : 'Disabled'}</span>
               <input 
                  type="checkbox" 
                  checked={settings.enabled !== false} 
                  onChange={e => setSettings({ ...settings, enabled: e.target.checked })} 
                  className="w-5 h-5 accent-[#1497F3]" 
               />
            </label>
         </div>
         
         <div>
            <h5 className="font-semibold text-sm mb-3 text-[#1497F3]">Rewards Configuration (JSON)</h5>
            <p className="text-xs text-white/50 mb-2">Properties required: id, type (credits/plan/nothing), value, label, color (hex), probability (0-100)</p>
            <textarea 
               className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm focus:border-[#1497F3] h-96 font-mono text-[#89E4FF] outline-none"
               value={jsonText}
               onChange={e => setJsonText(e.target.value)}
            ></textarea>
         </div>
         
         <div className="flex justify-end">
            <button onClick={handleSave} className="px-6 py-3 bg-[#1497F3] hover:bg-[#2081C3] text-white rounded-xl font-bold transition-colors">
               Save Configuration
            </button>
         </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
         <h3 className="font-bold text-xl mb-4">Analytics & History</h3>
         <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-black/30 border border-white/5 p-4 rounded-xl">
               <p className="text-white/50 text-xs uppercase font-semibold mb-1">Total Spins</p>
               <p className="font-bold text-3xl">{history.length}</p>
            </div>
            <div className="bg-black/30 border border-white/5 p-4 rounded-xl">
               <p className="text-white/50 text-xs uppercase font-semibold mb-1">Most Frequent Reward</p>
               <p className="font-bold text-2xl truncate text-[#1497F3]">{getStatsText()}</p>
            </div>
         </div>

         <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {history.slice(0, 50).map((h, i) => (
               <div key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5 text-sm">
                  <div>
                     <span className="text-[#1497F3] font-medium mr-2">{h.user_email || h.user_id}</span>
                     won <span className="font-bold ml-1">{h.rewardLabel}</span>
                  </div>
                  <div className="text-white/40 text-xs text-right">
                     {h.timestamp?.toDate ? h.timestamp.toDate().toLocaleString() : new Date(h.timestamp).toLocaleString()}
                  </div>
               </div>
            ))}
            {history.length === 0 && <div className="text-center text-white/50 py-4">No spin history available.</div>}
         </div>
      </div>
    </div>
  );
}
