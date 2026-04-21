"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function MoMViewer() {
    const router = useRouter();
    const params = useParams();
    const meetingId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [mom, setMom] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMOM = async () => {
            try {
                const res = await fetch(`/api/dashboard/mom/${meetingId}`);
                const data = await res.json();
                if (data.success) {
                    setMom(data.mom);
                } else {
                    setError(data.error || "Failed to load MoM details");
                }
            } catch (e) {
                console.error(e);
                setError("An error occurred while fetching the report.");
            } finally {
                setLoading(false);
            }
        };
        fetchMOM();
    }, [meetingId]);

    const handleDownload = () => {
        if (!mom) return;
        const safeTitle = mom.title.replace(/\s+/g, '_');
        const downloadUrl = `/api/dashboard/mom/download?url=${encodeURIComponent(mom.momUrl)}&filename=${encodeURIComponent(safeTitle)}`;
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `${safeTitle}_MoM.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-bold text-slate-700">Loading AI Meeting Minutes...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col p-8">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <button 
                        onClick={() => router.push('/dashboard/mom')}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                        Return to MoM History
                    </button>
                </div>
            </div>
        );
    }

    const previewUrl = `/api/dashboard/mom/download?url=${encodeURIComponent(mom.momUrl)}&filename=${encodeURIComponent(mom.title.replace(/\s+/g, '_'))}&mode=inline`;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans h-screen overflow-hidden">
            <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-50 shadow-sm shrink-0 gap-4 sm:gap-0">
                <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
                    <button
                        onClick={() => router.push('/dashboard/mom')}
                        className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors flex items-center justify-center shrink-0"
                        title="Back to MoM List"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div className="h-8 sm:h-10 w-px bg-slate-200"></div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-0.5 min-w-0">
                            <span className="bg-indigo-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm self-start">AI Generated MoM</span>
                            <h1 className="text-base sm:text-xl font-black text-slate-900 truncate max-w-full sm:max-w-md leading-tight">{mom.title}</h1>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                            {new Date(mom.endedAt).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })} • {mom.host?.username || "Unknown"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <button
                        onClick={handleDownload}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-900 font-bold text-white rounded-xl shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 text-xs sm:text-sm"
                    >
                        <span className="hidden xs:inline">Download PDF</span>
                        <span className="xs:hidden">Download</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                    <div className="hidden sm:block h-10 w-px bg-slate-200 mx-1"></div>
                    <div className="flex bg-slate-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-slate-200 shrink-0">
                        <span className="text-[9px] sm:text-[10px] font-bold text-indigo-700 uppercase tracking-tighter">Verified Official</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full flex flex-col items-center bg-slate-800 p-2 sm:p-4 md:p-8 overflow-y-auto">
                <div className="w-full max-w-5xl h-full min-h-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden border-2 sm:border-4 border-slate-700/50 flex flex-col transition-all duration-300">
                    <iframe 
                        src={previewUrl}
                        className="w-full h-full border-none"
                        title={mom.title}
                    />
                </div>
            </main>
        </div>
    );
}
