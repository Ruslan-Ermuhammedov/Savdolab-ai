import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, setDoc } from 'firebase/firestore';
import { Search, Filter, Trash2, ExternalLink, Download, FileText, BarChart2, Eye, Copy, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

import WinningProductView from './AnalyzerWinningProduct';
import TrendingProductsView from './AnalyzerTrendingProducts';
import CompetitorSpyView from './AnalyzerCompetitorSpy';
import AdAnalyzerView from './AnalyzerAdAnalyzer';

interface SavedReportsProps {
    user: any;
    onShowToast: (msg: string) => void;
    onOpenTask?: (query: string, mode: string) => void; // if they want to reopen in Analyzer, maybe? The task says "Detail View: Display complete report." This means we could navigate to Analyzer with some report ID or render it here.
}

export default function SavedReports({ user, onShowToast }: SavedReportsProps) {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [selectedReport, setSelectedReport] = useState<any | null>(null);

    useEffect(() => {
        fetchReports();
    }, [user]);

    const fetchReports = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            // Simplified query to check if permissions work without orderBy (which requires an index)
            const q = query(collection(db, 'saved_reports'), where('userId', '==', user.uid));
            const snap = await getDocs(q);
            const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort client-side
            fetched.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
            setReports(fetched);
        } catch (e) {
            console.error("Error fetching reports", e);
            onShowToast("Hisobotlarni yuklashda xatolik");
        }
        setLoading(false);
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if(e) e.stopPropagation();
        if(!confirm("Haqiqatan ham bu hisobotni o'chirmoqchimisiz?")) return;
        try {
            await deleteDoc(doc(db, 'saved_reports', id));
            setReports(prev => prev.filter(r => r.id !== id));
            if(selectedReport && selectedReport.id === id) setSelectedReport(null);
            onShowToast("Hisobot o'chirildi");
        } catch (err) {
            console.error(err);
            onShowToast("Xatolik yuz berdi");
        }
    };

    const handleDuplicate = async (report: any, e?: React.MouseEvent) => {
        if(e) e.stopPropagation();
        try {
            const newRef = doc(collection(db, 'saved_reports'));
            const newReport = {
                ...report,
                title: report.title + ' (Nusxa)',
                createdAt: Date.now(),
                id: newRef.id // not stored in DB, but just in case
            };
            delete newReport.id;
            await setDoc(newRef, newReport);
            onShowToast("Nusxa olindi");
            fetchReports();
        } catch(err) {
            console.error(err);
            onShowToast("Xatolik yuz berdi");
        }
    };

    const handleExportPDF = (report: any) => {
        window.print();
    };

    const handleOpen = (report: any) => {
        try {
            setDoc(doc(db, 'saved_reports', report.id), { opens: (report.opens || 0) + 1 }, { merge: true });
        } catch(e) {}
        setSelectedReport(report);
    };

    const filteredReports = reports.filter(r => {
        if (filterType !== 'all' && r.type !== filterType) return false;
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            return r.title?.toLowerCase().includes(s) || r.type?.toLowerCase().includes(s);
        }
        return true;
    });

    const getIconForType = (type: string) => {
        switch(type) {
            case 'winning-product': return <BarChart2 size={16} className="text-blue-400" />;
            case 'trending-products': return <BarChart2 size={16} className="text-purple-400" />;
            case 'competitor-spy': return <Eye size={16} className="text-red-400" />;
            case 'ad-analyzer': return <FileText size={16} className="text-green-400" />;
            default: return <FileText size={16} className="text-gray-400" />;
        }
    };

    const formatType = (type: string) => {
        switch(type) {
            case 'winning-product': return 'Product Finder';
            case 'trending-products': return 'Trend Hunter';
            case 'competitor-spy': return 'Competitor Spy';
            case 'ad-analyzer': return 'Ad Analyzer';
            default: return type;
        }
    };

    if (selectedReport) {
        return (
            <div className="flex flex-col h-full bg-[#0f1115] w-full p-4 md:p-8 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8 max-w-[800px] mx-auto w-full">
                    <button onClick={() => setSelectedReport(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 text-sm transition-colors">
                        Ortga
                    </button>
                    <div className="flex gap-2">
                        <button onClick={() => handleExportPDF(selectedReport)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 text-sm transition-colors flex items-center gap-2">
                            <Download size={14} /> PDF
                        </button>
                        <button onClick={() => handleDuplicate(selectedReport)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 text-sm transition-colors flex items-center gap-2">
                            <Copy size={14} /> Duplicate
                        </button>
                        <button onClick={() => handleDelete(selectedReport.id)} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm transition-colors flex items-center gap-2">
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                </div>

                <div className="max-w-[800px] mx-auto w-full bg-black/40 border border-white/10 rounded-[24px] p-6 md:p-10 mb-20 printable-area">
                    <h1 className="text-3xl font-bold mb-2">{selectedReport.title}</h1>
                    <div className="flex items-center gap-4 text-white/50 text-sm mb-8 pb-6 border-b border-white/5">
                        <span className="flex items-center gap-1.5">{getIconForType(selectedReport.type)} {formatType(selectedReport.type)}</span>
                        <span>•</span>
                        <span>{new Date(selectedReport.createdAt).toLocaleString('uz-UZ')}</span>
                    </div>

                    <div className="prose prose-invert max-w-none text-white/80 w-full overflow-hidden">
                        {selectedReport.type === 'winning-product' && <WinningProductView data={selectedReport.data} />}
                        {selectedReport.type === 'trending-products' && <TrendingProductsView data={selectedReport.data} />}
                        {selectedReport.type === 'competitor-spy' && <CompetitorSpyView data={selectedReport.data} />}
                        {selectedReport.type === 'ad-analyzer' && <AdAnalyzerView data={selectedReport.data} />}
                        
                        {!['winning-product', 'trending-products', 'competitor-spy', 'ad-analyzer'].includes(selectedReport.type) && (
                            <pre className="whitespace-pre-wrap font-sans text-sm">
                                {JSON.stringify(selectedReport.data, null, 2)}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0f1115] w-full p-4 md:p-8">
            <div className="max-w-6xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Saqlangan Hisobotlar</h1>
                        <p className="text-white/60">Tahlil natijalarini bu yerda boshqaring.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                        <input
                            type="text"
                            placeholder="Qidirish..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#1497F3] transition-colors"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            value={filterType} 
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#1497F3] transition-colors appearance-none"
                        >
                            <option value="all">Barchasi</option>
                            <option value="winning-product">Product Reports</option>
                            <option value="trending-products">Trend Reports</option>
                            <option value="competitor-spy">Competitor Reports</option>
                            <option value="ad-analyzer">Ad Reports</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-8 h-8 rounded-full border-2 border-[#1497F3] border-t-transparent animate-spin"></div>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                        <FileText size={48} className="text-white/20 mb-4" />
                        <h3 className="text-xl font-bold text-white/50 mb-2">Hisobotlar yo'q</h3>
                        <p className="text-white/30 text-sm">Hali hech qanday natija saqlamadingiz.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
                        {filteredReports.map((report) => (
                            <motion.div 
                                key={report.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => handleOpen(report)}
                                className="bg-black/30 border border-white/10 rounded-2xl p-5 hover:bg-white/5 transition-all cursor-pointer group flex flex-col h-48"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-bold text-lg leading-tight line-clamp-2 text-white/90 group-hover:text-white transition-colors">
                                        {report.title}
                                    </h3>
                                    <div className="p-2 bg-white/5 rounded-lg text-white/50">
                                        {getIconForType(report.type)}
                                    </div>
                                </div>
                                <div className="text-xs text-white/40 mb-auto">
                                    {formatType(report.type)}
                                </div>
                                
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                    <span className="text-xs text-white/40">{new Date(report.createdAt).toLocaleDateString('uz-UZ')}</span>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => handleDuplicate(report, e)} className="p-1.5 hover:bg-white/10 rounded-md text-white/60 hover:text-white transition-colors" title="Nusxa olish">
                                            <Copy size={14} />
                                        </button>
                                        <button onClick={(e) => handleDelete(report.id, e)} className="p-1.5 hover:bg-red-500/20 rounded-md text-white/60 hover:text-red-400 transition-colors" title="O'chirish">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
