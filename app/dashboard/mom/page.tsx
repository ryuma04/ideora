"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MOMHistory() {
    const router = useRouter();
    const [user, setUser] = useState({ username: "Username", profileImage: "" });
    const [moms, setMoms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch profile
                const profileRes = await fetch('/api/dashboard/profile');
                const profileData = await profileRes.json();
                if (profileData.data) {
                    setUser({
                        username: profileData.data.username,
                        profileImage: profileData.data.profileImage
                    });
                }

                // Fetch moms
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

        fetchData();
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
        <div className="min-h-screen bg-slate-50 flex overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            <div 
                onClick={() => setIsSidebarOpen(false)} 
                className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            ></div>

            {/* Sidebar Navigation */}
            <aside className={`fixed inset-y-0 left-0 w-[280px] bg-white backdrop-blur-xl border-r border-slate-200/60 p-6 flex flex-col z-50 lg:relative lg:translate-x-0 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Close button for mobile */}
                <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer" onClick={() => router.push('/')}>
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">Ideora</span>
                </div>

                <nav className="flex-1 space-y-1">
                    <button onClick={() => router.push('/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 rounded-xl hover:bg-slate-100/80 hover:text-slate-900 font-medium transition-all active:scale-[0.98]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Meetings
                    </button>

                    <button onClick={() => router.push('/dashboard/documents')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 rounded-xl hover:bg-slate-100/80 hover:text-slate-900 font-medium transition-all active:scale-[0.98]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Documents
                    </button>

                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50/60 text-indigo-700 rounded-xl font-semibold border border-indigo-100/50 transition-all shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        MOM
                    </button>

                    <button onClick={() => router.push('/dashboard/meetingHistory')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 rounded-xl hover:bg-slate-100/80 hover:text-slate-900 font-medium transition-all active:scale-[0.98]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Meeting History
                    </button>
                </nav>
            </aside>

            {/* Content Display */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-8 py-5 flex items-center justify-between sticky top-0 z-10 w-full">
                    <div className="flex items-center gap-4">
                        {/* Hamburger menu for mobile */}
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">Minutes of Meeting</h1>
                    </div>
                    
                    <div className="relative group cursor-pointer inline-block" onClick={() => router.push('/dashboard/profile')}>
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 blur transition duration-300"></div>
                        <img
                            src={user.profileImage || "/profile_image.png"}
                            alt="Profile"
                            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                    </div>
                </header>

                <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-y-auto animate-[fade-in-up_0.6s_ease-out_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <div className="mb-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        Minutes of Meeting (MoM)
                    </h2>
                    <p className="text-slate-500 mt-2 text-sm sm:text-base">Access your AI-generated professional meeting minutes and summary reports.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20">
                            <div className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4 border-t-2 border-b-2 border-indigo-600 rounded-full"></div>
                            <p className="text-slate-400">Loading your minutes...</p>
                        </div>
                    ) : moms.length > 0 ? (
                        moms.map((mom: any) => (
                            <div
                                key={mom._id}
                                onClick={() => router.push(`/dashboard/mom/${mom._id}`)}
                                className="bg-white rounded-3xl border border-slate-200/60 p-6 hover:shadow-xl hover:border-indigo-400 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center font-bold text-xl group-hover:bg-red-600 group-hover:text-white transition-colors shadow-sm border border-red-100 group-hover:border-red-500">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-200 tracking-wider">
                                        PDF REPORT
                                    </span>
                                </div>
                                
                                <h3 className="font-bold text-xl text-slate-900 mb-1 line-clamp-2 mt-2">{mom.title}</h3>
                                
                                <div className="mt-auto pt-4 text-[11px] sm:text-xs text-slate-500 flex flex-col gap-1">
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

                                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(mom.momUrl, mom.title);
                                        }}
                                        className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group/btn"
                                    >
                                        <span>Download</span>
                                        <svg className="w-4 h-4 group-hover/btn:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </button>

                                    <button 
                                        className="text-xs sm:text-sm font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 group/view"
                                    >
                                        <span>View in Browser</span>
                                        <svg className="w-4 h-4 group-hover/view:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300 px-6">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <p className="text-lg font-bold text-slate-600">No MoM Reports Yet</p>
                            <p className="text-sm text-slate-400 mt-1 max-w-sm text-center font-medium">Complete a meeting and end the session to automatically generate professional AI minutes.</p>
                        </div>
                    )}
                </div>
            </div>
            </main>
        </div>
    );
}
