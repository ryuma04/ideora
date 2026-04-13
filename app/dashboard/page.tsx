"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState({ username: "Username", profileImage: "" });
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [scheduleData, setScheduleData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        isWaitingRoomEnabled: false
    });
    const [loading, setLoading] = useState(false);


    const handleScheduleMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const scheduledDateTime = new Date(`${scheduleData.date}T${scheduleData.time}`);
            if (scheduledDateTime <= new Date()) {
                alert("Please select a future date and time");
                setLoading(false);
                return;
            }

            const meetingCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            const res = await fetch('/api/meeting/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: scheduleData.title,
                    description: scheduleData.description,
                    meetingCode,
                    isInstant: false,
                    startTime: scheduledDateTime.toISOString(),
                    isWaitingRoomEnabled: scheduleData.isWaitingRoomEnabled
                }),
            });

            const data = await res.json();
            if (data.success) {
                setIsScheduleModalOpen(false);
                setScheduleData({ title: '', description: '', date: '', time: '', isWaitingRoomEnabled: false });
            } else {
                alert(data.error || "Failed to schedule meeting");
            }
        } catch (error) {
            console.error("Error scheduling meeting:", error);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const getUserDetails = async () => {
            try {
                // Fetch profile
                const res = await fetch('/api/dashboard/profile');
                const data = await res.json();
                if (data.data) {
                    setUser({
                        username: data.data.username,
                        profileImage: data.data.profileImage
                    });
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };
        getUserDetails();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            <div 
                onClick={() => setIsSidebarOpen(false)} 
                className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            ></div>

            {/* Sidebar */}
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

                {/* Logo */}
                <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer" onClick={() => router.push('/')}>
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">Ideora</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50/60 text-indigo-700 rounded-xl font-semibold border border-indigo-100/50 transition-all shadow-sm">
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

                    <button onClick={() => router.push('/dashboard/mom')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 rounded-xl hover:bg-slate-100/80 hover:text-slate-900 font-medium transition-all active:scale-[0.98]">
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

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
                {/* Header */}
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
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate max-w-[200px] sm:max-w-none">Welcome, {user.username}</h1>
                    </div>

                    {/* Profile Avatar */}
                    <div className="relative group cursor-pointer inline-block" onClick={() => router.push('/dashboard/profile')}>
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 blur transition duration-300"></div>
                        <img
                            src={user.profileImage || "/profile_image.png"}
                            alt="Profile"
                            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full overflow-y-auto animate-[fade-in-up_0.6s_ease-out_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                    {/* Section Header */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 text-center sm:text-left">Quick Actions</h2>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                            <button
                                onClick={() => router.push('/meeting/joinMeeting')}
                                className="px-5 py-2.5 bg-white border border-slate-200 shadow-sm text-slate-700 font-medium rounded-xl hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all active:scale-[0.98] flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                Join
                            </button>
                            <button
                                onClick={() => setIsScheduleModalOpen(true)}
                                className="px-5 py-2.5 bg-white border border-slate-200 shadow-sm text-slate-700 font-medium rounded-xl hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all active:scale-[0.98] flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Schedule
                            </button>
                            <button
                                onClick={() => router.push('meeting/createMeeting')}
                                className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Meeting
                            </button>
                        </div>
                    </div>

                    {/* Meetings List */}
                    <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight">Ready to start a meeting?</h3>
                        <p className="text-slate-500 mb-10 max-w-md mx-auto text-base sm:text-lg leading-relaxed">Create a new meeting, join one with a code, or schedule one for later.</p>
                        
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button
                                onClick={() => router.push('meeting/createMeeting')}
                                className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-[0.98] text-lg"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Meeting
                            </button>
                            <button
                                onClick={() => router.push('/meeting/joinMeeting')}
                                className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-2xl hover:border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98] text-lg shadow-sm"
                            >
                                <svg className="w-6 h-6 text-slate-400 group-hover:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                Join Meeting
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            {/* Schedule Meeting Modal */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in duration-200 border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-900">Schedule Meeting</h3>
                            <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleScheduleMeeting} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest text-[10px]">Meeting Title</label>
                                <input
                                    type="text"
                                    required
                                    value={scheduleData.title}
                                    onChange={(e) => setScheduleData({ ...scheduleData, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 placeholder:text-slate-400"
                                    placeholder="e.g. Weekly Sync"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest text-[10px]">Description (Optional)</label>
                                <textarea
                                    value={scheduleData.description}
                                    onChange={(e) => setScheduleData({ ...scheduleData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none h-24 text-slate-900 placeholder:text-slate-400"
                                    placeholder="Meeting agenda..."
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest text-[10px]">Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={scheduleData.date}
                                        onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest text-[10px]">Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={scheduleData.time}
                                        onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 group cursor-pointer" onClick={() => setScheduleData({ ...scheduleData, isWaitingRoomEnabled: !scheduleData.isWaitingRoomEnabled })}>
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${scheduleData.isWaitingRoomEnabled ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                    {scheduleData.isWaitingRoomEnabled && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                                <label className="text-sm font-bold text-slate-700 cursor-pointer">
                                    Enable Waiting Room
                                </label>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsScheduleModalOpen(false)}
                                    className="flex-1 px-4 py-3.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        "Schedule Now"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}