import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';

export default function SystemSettings({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'app_settings', 'general'));
      if (snap.exists()) {
         setSettings(snap.data());
      }
    } catch (err) {
      console.error(err);
      onShowToast("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
     setIsSaving(true);
     try {
        await setDoc(doc(db, 'app_settings', 'general'), settings);
        
        await setDoc(doc(collection(db, 'audit_logs')), {
           admin: 'Admin',
           action: `Updated system settings`,
           target: 'System Settings',
           timestamp: new Date()
        });

        onShowToast("System settings saved");
     } catch (err: any) {
        onShowToast("Error: " + err.message);
     } finally {
        setIsSaving(false);
     }
  };

  const handleChange = (key: string, value: string) => {
     setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="text-white/50">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold">System Settings</h2>
         <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-[#1497F3] hover:bg-[#2081C3] text-white rounded-xl font-bold transition-colors disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save Settings'}
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg border-b border-white/10 pb-2 mb-4">Payment Methods</h3>
            
            <div>
               <label className="block text-sm text-white/50 mb-1">Humo Card Number</label>
               <input type="text" value={settings.humoCard || ''} onChange={e => handleChange('humoCard', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3] text-sm" placeholder="8600 0000 0000 0000" />
            </div>
            <div>
               <label className="block text-sm text-white/50 mb-1">Humo Card Holder</label>
               <input type="text" value={settings.humoHolder || ''} onChange={e => handleChange('humoHolder', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3] text-sm" placeholder="John Doe" />
            </div>
            <div className="pt-2">
               <label className="block text-sm text-white/50 mb-1">Visa Card Number</label>
               <input type="text" value={settings.visaCard || ''} onChange={e => handleChange('visaCard', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3] text-sm" placeholder="4000 0000 0000 0000" />
            </div>
            <div>
               <label className="block text-sm text-white/50 mb-1">Visa Card Holder</label>
               <input type="text" value={settings.visaHolder || ''} onChange={e => handleChange('visaHolder', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3] text-sm" placeholder="John Doe" />
            </div>
         </div>

         <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg border-b border-white/10 pb-2 mb-4">Links & Contacts</h3>
            
            <div>
               <label className="block text-sm text-white/50 mb-1">Support URL (Telegram / Web)</label>
               <input type="text" value={settings.supportLink || ''} onChange={e => handleChange('supportLink', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3] text-sm" placeholder="https://t.me/support..." />
            </div>
            <div>
               <label className="block text-sm text-white/50 mb-1">Terms of Service URL</label>
               <input type="text" value={settings.termsLink || ''} onChange={e => handleChange('termsLink', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3] text-sm" placeholder="https://..." />
            </div>
            <div>
               <label className="block text-sm text-white/50 mb-1">Privacy Policy URL</label>
               <input type="text" value={settings.privacyLink || ''} onChange={e => handleChange('privacyLink', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3] text-sm" placeholder="https://..." />
            </div>
            <div>
               <label className="block text-sm text-white/50 mb-1">Contact Email</label>
               <input type="email" value={settings.contactEmail || ''} onChange={e => handleChange('contactEmail', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#1497F3] text-sm" placeholder="support@savdolab.com" />
            </div>
         </div>
      </div>
    </div>
  );
}
