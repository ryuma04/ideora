"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';

export default function JoinMeeting() {
    const router = useRouter();
    const [meetingCode, setMeetingCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        fetch('/api/dashboard/profile')
            .then(res => setIsAuth(res.ok))
            .catch(() => setIsAuth(false));
    }, []);

    const joinMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (meetingCode.trim().length < 3) {
            toast.error("Please enter a valid meeting code");
            return;
        }

        setLoading(true);
        try {
            router.push(`/meeting/${meetingCode}`);
        } catch (error) {
            console.error("Join meeting failed", error);
            toast.error("Failed to join meeting");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
            <Toaster />

            {/* Background Decorative Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-100/40 blur-[130px] rounded-full animate-pulse"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-100/30 blur-[130px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full z-10 max-w-[420px] mx-auto">
                <div className="bg-white rounded-3xl shadow-[0_0_80px_-20px_rgba(79,70,229,0.4)] ring-1 ring-indigo-500/20 p-8 sm:p-10 opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards] relative group">
                    <div className="relative z-10">
                        <div className="text-center mb-10">
                            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/30 mb-6 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3">
                                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Join Meeting</h2>
                            <p className="mt-3 text-slate-500 font-medium">Enter a code to enter the room.</p>
                        </div>

                        <form className="space-y-8" onSubmit={joinMeeting}>
                            <div>
                                <label htmlFor="meeting-code" className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Access Code</label>
                                <input
                                    id="meeting-code"
                                    name="code"
                                    type="text"
                                    required
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal text-center tracking-[4px]"
                                    placeholder="abc-123-xyz"
                                    value={meetingCode}
                                    onChange={(e) => setMeetingCode(e.target.value)}
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4.5 px-6 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl shadow-indigo-600/20"
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-6 w-6 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    )}
                                    {loading ? 'Entering...' : 'Jump In'}
                                </button>
                            </div>

                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => router.push(isAuth ? '/dashboard' : '/')}
                                    className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 mx-auto group/back"
                                >
                                    <svg className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    {isAuth ? 'Return to Dashboard' : 'Return to Home'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
