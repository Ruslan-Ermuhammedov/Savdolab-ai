import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';

export default function FeatureToggles({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const defaultToggles = {
     showLandingPage: true,
     enablePayments: true,
     enableSpinWheel: true,
     enableSupportMenu: true,
     maintenanceMode: false,
     requireEmailVerification: false
  };

  useEffect(() => {
    fetchToggles();
  }, []);

  const fetchToggles = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'app_settings', 'features'));
      if (snap.exists() && snap.data().toggles) {
         setFeatures({ ...defaultToggles, ...snap.data().toggles });
      } else {
         setFeatures(defaultToggles);
      }
    } catch (err) {
      console.error(err);
      onShowToast("Failed to load feature toggles");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
     setIsSaving(true);
     try {
        await setDoc(doc(db, 'app_settings', 'features'), { toggles: features });
        
        await setDoc(doc(collection(db, 'audit_logs')), {
           admin: 'Admin',
           action: `Updated feature toggles`,
           target: 'System Settings',
           timestamp: new Date()
        });

        onShowToast("Feature toggles saved");
     } catch (err: any) {
        onShowToast("Error: " + err.message);
     } finally {
        setIsSaving(false);
     }
  };

  const toggleFeature = (key: string) => {
     setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) return <div className="text-white/50">Loading toggles...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold">Feature Toggles</h2>
         <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-[#1497F3] hover:bg-[#2081C3] text-white rounded-xl font-bold transition-colors disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save Settings'}
         </button>
      </div>

      <p className="text-white/50">Enable or disable major features across the platform.</p>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
         {Object.entries(features).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
               <div>
                  <h4 className="font-bold text-sm">{key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, str => str.toUpperCase())}</h4>
                  <p className="text-xs text-white/50 font-mono mt-1">{key}</p>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={value} onChange={() => toggleFeature(key)} className="sr-only peer" />
                  <div className={"w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all " + (value ? 'peer-checked:bg-[#1497F3]' : '')}></div>
               </label>
            </div>
         ))}
      </div>
    </div>
  );
}
