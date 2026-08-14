import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Play, Square, Eye, MousePointerClick } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '../i18n';

export default function AdminBanners({ onShowToast }: { onShowToast: (msg: string) => void }) {
    const { t } = useI18n();
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBanner, setEditingBanner] = useState<any | null>(null);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'promo_banners'));
            const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setBanners(fetched);
        } catch (e) {
            console.error(e);
            onShowToast(t('common.error'));
        }
        setLoading(false);
    };

    const handleCreate = async () => {
        const newBanner = {
            title: t('admin.bannerNewTitle'),
            description: t('admin.bannerNewDescription'),
            promoCode: 'SAVE50',
            ctaLink: '',
            enabled: false,
            enableCountdown: false,
            startDate: Date.now(),
            endDate: Date.now() + 86400000,
            impressions: 0,
            clicks: 0
        };
        try {
            const ref = await addDoc(collection(db, 'promo_banners'), newBanner);
            setBanners([...banners, { id: ref.id, ...newBanner }]);
            onShowToast(t('admin.created'));
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('admin.deleteConfirm'))) return;
        try {
            await deleteDoc(doc(db, 'promo_banners', id));
            setBanners(banners.filter(b => b.id !== id));
            onShowToast(t('admin.deleted'));
        } catch (e) {}
    };

    const handleToggle = async (id: string, current: boolean) => {
        try {
            await updateDoc(doc(db, 'promo_banners', id), { enabled: !current });
            setBanners(banners.map(b => b.id === id ? { ...b, enabled: !current } : b));
        } catch (e) {}
    };

    const handleSaveEdit = async () => {
        if (!editingBanner) return;
        try {
            const { id, ...data } = editingBanner;
            await updateDoc(doc(db, 'promo_banners', id), data);
            setBanners(banners.map(b => b.id === id ? editingBanner : b));
            setEditingBanner(null);
            onShowToast(t('common.save'));
        } catch (e) {
            onShowToast(t('common.error'));
        }
    };

    const handleDateChange = (field: 'startDate' | 'endDate', val: string) => {
        const d = new Date(val).getTime();
        setEditingBanner({ ...editingBanner, [field]: d });
    };

    const formatDate = (ms: number) => {
        if (!ms) return '';
        const d = new Date(ms);
        return d.toISOString().slice(0, 16);
    };

    if (loading) return <div>{t('common.loading')}</div>;

    if (editingBanner) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4">{t('admin.bannerEditor')}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-white/50 block mb-1">{t('admin.title')}</label>
                        <input className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white" value={editingBanner.title} onChange={e => setEditingBanner({...editingBanner, title: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-white/50 block mb-1">{t('admin.description')}</label>
                        <input className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white" value={editingBanner.description} onChange={e => setEditingBanner({...editingBanner, description: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-white/50 block mb-1">{t('admin.promoCode')}</label>
                        <input className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white" value={editingBanner.promoCode} onChange={e => setEditingBanner({...editingBanner, promoCode: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-white/50 block mb-1">{t('admin.ctaLink')}</label>
                        <input className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white" value={editingBanner.ctaLink} onChange={e => setEditingBanner({...editingBanner, ctaLink: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-white/50 block mb-1">{t('admin.start')}</label>
                            <input type="datetime-local" className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white" value={formatDate(editingBanner.startDate)} onChange={e => handleDateChange('startDate', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs text-white/50 block mb-1">{t('admin.end')}</label>
                            <input type="datetime-local" className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white" value={formatDate(editingBanner.endDate)} onChange={e => handleDateChange('endDate', e.target.value)} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={editingBanner.enableCountdown} onChange={e => setEditingBanner({...editingBanner, enableCountdown: e.target.checked})} className="w-4 h-4" />
                        <label className="text-sm">{t('admin.enableCountdown')}</label>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button onClick={handleSaveEdit} className="bg-[#1497F3] text-white px-4 py-2 rounded-lg text-sm font-medium">{t('common.save')}</button>
                        <button onClick={() => setEditingBanner(null)} className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium">{t('common.cancel')}</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-4">
                <h3 className="font-bold">{t('admin.promoBanners')}</h3>
                <button onClick={handleCreate} className="flex items-center gap-2 bg-[#1497F3] text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                    <Plus size={16} /> {t('admin.add')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {banners.map(banner => {
                    const ctr = banner.impressions > 0 ? ((banner.clicks / banner.impressions) * 100).toFixed(1) : '0.0';
                    return (
                        <div key={banner.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-white mb-1">{banner.title}</h4>
                                    <p className="text-xs text-white/50">{banner.description}</p>
                                </div>
                                <button onClick={() => handleToggle(banner.id, banner.enabled)} className={`p-1.5 rounded-md ${banner.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {banner.enabled ? <Play size={14} /> : <Square size={14} />}
                                </button>
                            </div>
                            <div className="flex justify-between text-xs text-white/50 mb-4 border-b border-white/5 pb-3">
                                <div className="flex items-center gap-1.5"><Eye size={12}/> {banner.impressions || 0}</div>
                                <div className="flex items-center gap-1.5"><MousePointerClick size={12}/> {banner.clicks || 0}</div>
                                <div>CTR: {ctr}%</div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setEditingBanner(banner)} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(banner.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
