"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MOMHistory() {
    const router = useRouter();
    const [moms, setMoms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMOMs = async () => {
            try {
                const res = await fetch('/api/dashboard/mom');
                const data = await res.json();
                if (data.success) {
                    setMoms(data.momDocuments);
                }
            } catch (e) {
                console.error("Failed to load MOM documents", e);
            } finally {
                setLoading(false);
            }
        };

        fetchMOMs();
    }, []);

    const handleDownload = (url: string, title: string) => {
        // Download via our professional backend proxy.
        // This attaches a secure signature that bypasses Cloudinary's local restrictions.
        const safeTitle = title.replace(/\s+/g, '_');
        const proxyUrl = `/api/dashboard/mom/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(safeTitle)}`;
        
        const link = document.createElement('a');
        link.href = proxyUrl;
        link.setAttribute('download', `${safeTitle}_MoM.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-white border-r border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <span className="text-xl font-semibold text-slate-900">Ideora</span>
                </div>

                <nav className="space-y-2">
                    <button onClick={() => router.push('/dashboard')} className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Meetings
                    </button>

                    <button onClick={() => router.push('/dashboard/documents')} className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Documents
                    </button>

                    <button onClick={() => router.push('/dashboard/mom')} className="w-full flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        MOM
                    </button>

                    <button onClick={() => router.push('/dashboard/meetingHistory')} className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Meeting History
                    </button>
                </nav>
            </aside>

            {/* Content Display */}
            <main className="flex-1 p-8">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        Minutes of Meeting (MoM)
                    </h2>
                    <p className="text-slate-500 mt-2">Access your AI-generated professional meeting minutes and summary reports.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-3 text-center py-20">
                            <div className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4 border-t-2 border-b-2 border-indigo-600 rounded-full"></div>
                            <p className="text-slate-400">Loading your minutes...</p>
                        </div>
                    ) : moms.length > 0 ? (
                        moms.map((mom: any) => (
                            <div
                                key={mom._id}
                                onClick={() => handleDownload(mom.momUrl, mom.title)}
                                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-xl hover:border-indigo-400 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold text-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-200 tracking-wider">
                                        PDF REPORT
                                    </span>
                                </div>
                                
                                <h3 className="font-bold text-lg text-slate-900 mb-1 line-clamp-2">{mom.title}</h3>
                                
                                <div className="mt-auto pt-4 text-xs text-slate-500 flex flex-col gap-1">
                                    <p className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        Date: {new Date(mom.endedAt).toLocaleDateString(undefined, {
                                            year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                    </p>
                                    <p className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        Role: <span className="capitalize">{mom.myRole}</span>
                                    </p>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-medium text-indigo-600">
                                    <span>Download/View MoM</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-300">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <p className="text-lg font-medium text-slate-500">No MoM Reports Yet</p>
                            <p className="text-sm text-slate-400 mt-1 max-w-sm text-center">Complete a meeting and end the session to automatically generate professional AI minutes.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
