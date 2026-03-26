"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState({ username: "Username", profileImage: "" });
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
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
                if (res.status === 401) {
                    router.push('/auth/login');
                    return;
                }
                const data = await res.json();
                if (data.data) {
                    setUser({
                        username: data.data.username,
                        profileImage: data.data.profileImage
                    });
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
                router.push('/auth/login');
            }
        };
        getUserDetails();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 p-6">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <span className="text-xl font-semibold text-slate-900">Ideora</span>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium">
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

                    <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Action Items
                    </button>

                    <button onClick={() => router.push('/dashboard/meetingHistory')} className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Meeting History
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-slate-900">Welcome, {user.username}</h1>

                    {/* Profile Avatar */}
                    <img
                        // setting the profile image as the dafault image if the user has not uploaded any image
                        src={user.profileImage || "/profile_image.png"}
                        alt="Profile"
                        onClick={() => router.push('/dashboard/profile')}
                        className="w-12 h-12 rounded-full cursor-pointer hover:opacity-80 object-cover"
                    />
                </header>

                {/* Content Area */}
                <div className="p-8">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Your Previous Meetings & Docs</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/meeting/joinMeeting')}
                                className="px-6 py-2.5 border border-indigo-600 text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                Join Meeting
                            </button>
                            <button
                                onClick={() => setIsScheduleModalOpen(true)}
                                className="px-6 py-2.5 bg-white border border-indigo-600 text-indigo-600 font-medium rounded-lg hover:bg-slate-50 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Schedule Meeting
                            </button>
                            <button
                                onClick={() => router.push('meeting/createMeeting')}
                                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Meeting
                            </button>
                        </div>
                    </div>

                    {/* Meetings List */}
                    <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to start a meeting?</h3>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">Create a new meeting, join one with a code, or schedule one for later.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <button
                                onClick={() => router.push('meeting/createMeeting')}
                                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Meeting
                            </button>
                            <button
                                onClick={() => router.push('/meeting/joinMeeting')}
                                className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Schedule Meeting</h3>
                            <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleScheduleMeeting} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Title</label>
                                <input
                                    type="text"
                                    required
                                    value={scheduleData.title}
                                    onChange={(e) => setScheduleData({ ...scheduleData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 placeholder-slate-400"
                                    placeholder="e.g. Weekly Sync"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                                <textarea
                                    value={scheduleData.description}
                                    onChange={(e) => setScheduleData({ ...scheduleData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-24 text-slate-800 placeholder-slate-400"
                                    placeholder="Meeting agenda..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={scheduleData.date}
                                        onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={scheduleData.time}
                                        onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center mt-4">
                                <input
                                    id="schedule-waiting-room"
                                    name="schedule-waiting-room"
                                    type="checkbox"
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    checked={scheduleData.isWaitingRoomEnabled}
                                    onChange={(e) => setScheduleData({ ...scheduleData, isWaitingRoomEnabled: e.target.checked })}
                                />
                                <label htmlFor="schedule-waiting-room" className="ml-2 block text-sm text-slate-700">
                                    Enable Waiting Room (Require host to admit participants)
                                </label>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsScheduleModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        "Schedule"
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