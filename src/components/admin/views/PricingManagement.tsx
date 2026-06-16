import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash, Save, Edit } from 'lucide-react';

export default function PricingManagement({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editPlan, setEditPlan] = useState<any>({
     id: '', name: '', price: '', credits: 0, description: '', badge: '',
     features: [''], active: true
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'pricing_plans'));
      const items: any[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setPlans(items.sort((a,b) => (a.price || 0) - (b.price || 0)));
    } catch (err) {
      console.error(err);
      onShowToast("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!editPlan.name || !editPlan.id) {
        onShowToast("ID and Name are required");
        return;
     }

     try {
        const cleanFeatures = editPlan.features.filter((f: string) => f.trim() !== '');
        const planToSave = { ...editPlan, features: cleanFeatures, price: Number(editPlan.price), credits: Number(editPlan.credits) };
        
        await setDoc(doc(db, 'pricing_plans', planToSave.id), planToSave);
        
        await setDoc(doc(collection(db, 'audit_logs')), {
           admin: 'Admin',
           action: `Saved pricing plan ${planToSave.id}`,
           target: 'Pricing',
           timestamp: new Date()
        });

        onShowToast("Plan saved successfully");
        setIsEditing(false);
        fetchPlans();
     } catch (err: any) {
        onShowToast("Error: " + err.message);
     }
  };

  const handleDelete = async (id: string) => {
     if (!confirm(`Tizimdan ${id} tarifini uchirishni xohlaysizmi?`)) return;
     try {
        await deleteDoc(doc(db, 'pricing_plans', id));
        onShowToast("Plan deleted");
        fetchPlans();
     } catch (err: any) {
        onShowToast("Delete failed");
     }
  };

  const openNew = () => {
     setEditPlan({ id: '', name: '', price: '', credits: 0, description: '', badge: '', features: [''], active: true });
     setIsEditing(true);
  };

  const openEdit = (p: any) => {
     setEditPlan({ ...p, features: p.features?.length ? [...p.features] : [''] });
     setIsEditing(true);
  };

  if (isEditing) {
     return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl w-full max-w-3xl">
           <h3 className="text-xl font-bold mb-6">{editPlan.id ? 'Edit Plan' : 'Create New Plan'}</h3>
           <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm text-white/50 mb-1">Plan ID (e.g. starter)</label>
                    <input type="text" value={editPlan.id} disabled={!!editPlan.id && !openNew} onChange={e => setEditPlan({...editPlan, id: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3]" required />
                 </div>
                 <div>
                    <label className="block text-sm text-white/50 mb-1">Display Name (e.g. Starter Plan)</label>
                    <input type="text" value={editPlan.name} onChange={e => setEditPlan({...editPlan, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3]" required />
                 </div>
                 <div>
                    <label className="block text-sm text-white/50 mb-1">Price (UZS)</label>
                    <input type="number" value={editPlan.price} onChange={e => setEditPlan({...editPlan, price: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3]" required />
                 </div>
                 <div>
                    <label className="block text-sm text-white/50 mb-1">Monthly Credits</label>
                    <input type="number" value={editPlan.credits} onChange={e => setEditPlan({...editPlan, credits: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3]" required />
                 </div>
              </div>
              <div>
                 <label className="block text-sm text-white/50 mb-1">Description</label>
                 <input type="text" value={editPlan.description} onChange={e => setEditPlan({...editPlan, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3]" />
              </div>
              <div>
                 <label className="block text-sm text-white/50 mb-1">Badge (optional, e.g. "Most Popular")</label>
                 <input type="text" value={editPlan.badge} onChange={e => setEditPlan({...editPlan, badge: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3]" />
              </div>
              <div>
                 <label className="block text-sm text-white/50 mb-2">Features</label>
                 {editPlan.features.map((f: string, idx: number) => (
                    <div key={idx} className="flex gap-2 mb-2">
                       <input type="text" value={f} onChange={e => {
                          const newF = [...editPlan.features];
                          newF[idx] = e.target.value;
                          setEditPlan({...editPlan, features: newF});
                       }} className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-[#1497F3]" placeholder="Feature description..." />
                       <button type="button" onClick={() => {
                          const newF = editPlan.features.filter((_: any, i: number) => i !== idx);
                          if(newF.length===0) newF.push('');
                          setEditPlan({...editPlan, features: newF});
                       }} className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30">
                           <Trash size={16} />
                       </button>
                    </div>
                 ))}
                 <button type="button" onClick={() => setEditPlan({...editPlan, features: [...editPlan.features, '']})} className="text-sm text-[#1497F3] hover:underline flex items-center gap-1 mt-2">
                    <Plus size={14} /> Add Feature
                 </button>
              </div>
              <div className="flex items-center gap-2 mt-4">
                 <input type="checkbox" id="active" checked={editPlan.active} onChange={e => setEditPlan({...editPlan, active: e.target.checked})} className="w-4 h-4" />
                 <label htmlFor="active" className="text-white/80">Plan is active and visible</label>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
                 <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors">Cancel</button>
                 <button type="submit" className="px-6 py-2.5 bg-[#1497F3] hover:bg-[#2081C3] text-white rounded-xl font-bold transition-colors flex items-center gap-2">
                    <Save size={16} /> Save Plan
                 </button>
              </div>
           </form>
        </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold">Pricing Plans</h2>
         <button onClick={openNew} className="bg-[#1497F3] hover:bg-[#2081C3] px-4 py-2 rounded-xl font-medium text-white transition-colors flex items-center gap-2 shadow-lg">
            <Plus size={16} /> Create Plan
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {loading ? (
            <div className="col-span-full py-12 text-center text-white/50">Loading plans...</div>
         ) : plans.length === 0 ? (
            <div className="col-span-full py-12 text-center text-white/50 border border-white/10 border-dashed rounded-2xl">No plans configured. Create one above.</div>
         ) : (
            plans.map(p => (
               <div key={p.id} className={`bg-white/5 border ${p.badge ? 'border-[#1497F3]/50' : 'border-white/10'} rounded-2xl p-6 relative`}>
                  {p.badge && (
                     <div className="absolute top-0 right-6 -translate-y-1/2 bg-[#1497F3] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        {p.badge}
                     </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <h3 className="text-xl font-bold">{p.name}</h3>
                        <p className="text-white/50 text-sm">{p.id}</p>
                     </div>
                     {!p.active && <span className="bg-red-500/20 text-red-400 text-[10px] uppercase px-2 py-0.5 rounded font-bold">Hidden</span>}
                  </div>
                  
                  <div className="mb-4">
                     <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[#1497F3]">{(p.price || 0).toLocaleString()}</span>
                        <span className="text-white/50 text-sm">UZS / month</span>
                     </div>
                     <p className="text-sm font-medium mt-1">
                        <span className="text-white/80">{p.credits}</span> <span className="text-white/50">Credits</span>
                     </p>
                  </div>

                  <div className="flex gap-2">
                     <button onClick={() => openEdit(p)} className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1">
                        <Edit size={14} /> Edit
                     </button>
                     <button onClick={() => handleDelete(p.id)} className="w-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center rounded-lg transition-colors">
                        <Trash size={14} />
                     </button>
                  </div>
               </div>
            ))
         )}
      </div>
    </div>
  );
}
