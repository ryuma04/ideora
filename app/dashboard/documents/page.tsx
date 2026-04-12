"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '../page';

export default function DocumentHistory() {
    const router = useRouter();
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const res = await fetch('/api/dashboard/documents');
                const data = await res.json();
                if (data.success) {
                    setDocs(data.documents);
                }
            } catch (e) {
                console.error("Failed to load documents", e);
            } finally {
                setLoading(false);
            }
        };

        fetchDocs();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Navigation - Identical to Dashboard but with "Documents" active */}
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

                    <button onClick={() => router.push('/dashboard/documents')}
                        className="w-full flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Documents
                    </button>

                    <button onClick={() => router.push('/dashboard/mom')} className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        MOM
                    </button>

                    <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Meeting History
                    </button>
                </nav>
            </aside>

            {/* Content Display */}
            <main className="flex-1 p-8">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                        Meeting Documents Vault
                    </h2>
                    <p className="text-slate-500">Access, review, and export the official documentation and whiteboard reports generated after your meetings.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-3 text-center py-20 text-slate-400">Loading documents...</div>
                    ) : docs.length > 0 ? (
                        docs.map((doc: any) => (
                            <div
                                key={doc._id}
                                onClick={() => router.push(`/dashboard/documents/${doc._id}`)}
                                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-xl hover:border-indigo-400 hover:-translate-y-1 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        {doc.title.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-200 tracking-wider">
                                        REPORT
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 mb-1">{doc.title}</h3>
                                <div className="text-xs text-slate-500 flex flex-col gap-1">
                                    <p>Ended: {new Date(doc.endedAt).toLocaleDateString(undefined, {
                                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}</p>
                                    <p className="text-indigo-600 font-medium">{doc.documentCount} Modules Saved</p>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-medium">
                                    <span className="text-slate-400 group-hover:text-indigo-600 transition-colors">Open Document Viewer &rarr;</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-300">
                            <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <p className="text-lg font-medium text-slate-500">No Documents Found</p>
                            <p className="text-sm text-slate-400 mt-1 max-w-sm text-center">Host a meeting and use the Brainstorming tools to generate official reports.</p>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
