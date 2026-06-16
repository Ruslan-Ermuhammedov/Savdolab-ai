import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';

export default function AgentManager({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const defaultAgents = [
     { id: 'winning-product', name: 'Winning Product Finder', enabled: true, cost: 5, description: 'Find high-margin products with low competition in seconds.', visible: true },
     { id: 'trending-products', name: 'Trend Hunter', enabled: true, cost: 3, description: 'Spot viral trends before they hit the mainstream market.', visible: true },
     { id: 'competitor-spy', name: 'Competitor Spy', enabled: true, cost: 10, description: 'Reverse engineer your competitors successful stores.', visible: true },
     { id: 'ad-analyzer', name: 'Ad Analyzer', enabled: true, cost: 15, description: 'Generate high-converting ad copy and creatives instantly.', visible: true }
  ];

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'app_settings', 'agents'));
      if (snap.exists() && snap.data().list) {
         setAgents(snap.data().list);
      } else {
         setAgents(defaultAgents);
      }
    } catch (err) {
      console.error(err);
      onShowToast("Failed to load agents settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
     setIsSaving(true);
     try {
        await setDoc(doc(db, 'app_settings', 'agents'), { list: agents });
        
        await setDoc(doc(collection(db, 'audit_logs')), {
           admin: 'Admin',
           action: `Updated AI Agents settings`,
           target: 'Agents',
           timestamp: new Date()
        });

        onShowToast("Agent settings saved");
     } catch (err: any) {
        onShowToast("Error: " + err.message);
     } finally {
        setIsSaving(false);
     }
  };

  const handleChange = (id: string, field: string, value: any) => {
     setAgents(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  if (loading) return <div className="text-white/50">Loading configurations...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold">AI Agent Manager</h2>
         <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-[#1497F3] hover:bg-[#2081C3] text-white rounded-xl font-bold transition-colors disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save All Changes'}
         </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
         {agents.map(agent => (
            <div key={agent.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
               {!agent.enabled && <div className="absolute top-4 right-4 bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold uppercase">Disabled</div>}
               
               <h3 className="font-bold text-lg mb-1">{agent.name}</h3>
               <p className="text-white/50 text-xs font-mono mb-6">{agent.id}</p>

               <div className="space-y-4">
                  <div>
                     <label className="block text-sm text-white/50 mb-1">Description</label>
                     <input type="text" value={agent.description} onChange={e => handleChange(agent.id, 'description', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3] text-sm" />
                  </div>
                  
                  <div>
                     <label className="block text-sm text-white/50 mb-1">Credit Cost (Per Request)</label>
                     <input type="number" value={agent.cost} onChange={e => handleChange(agent.id, 'cost', Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3] text-sm" />
                  </div>

                  <div className="flex gap-6 pt-4 border-t border-white/5 mt-4">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={agent.enabled} onChange={e => handleChange(agent.id, 'enabled', e.target.checked)} className="w-4 h-4 accent-[#1497F3]" />
                        <span className="text-sm font-medium">Enabled</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={agent.visible} onChange={e => handleChange(agent.id, 'visible', e.target.checked)} className="w-4 h-4 accent-[#1497F3]" />
                        <span className="text-sm font-medium">Visible in Menu</span>
                     </label>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
