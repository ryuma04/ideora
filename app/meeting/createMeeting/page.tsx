"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';

export default function CreateMeeting() {
    const router = useRouter();
    const [meetingTitle, setMeetingTitle] = useState("");
    const [isWaitingRoomEnabled, setIsWaitingRoomEnabled] = useState(false);
    const [loading, setLoading] = useState(false);

    const createMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);

            const generateCode = () => {
                const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
                let code = '';
                for (let i = 0; i < 3; i++) {
                    let segment = '';
                    for (let j = 0; j < 3; j++) {
                        segment += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    code += segment + (i < 2 ? '-' : '');
                }
                return code;
            }

            const meetingCode = generateCode();

            const response = await fetch('/api/meeting/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: meetingTitle,
                    meetingCode: meetingCode,
                    isInstant: true,
                    isWaitingRoomEnabled: isWaitingRoomEnabled
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create meeting");
            }

            toast.success("Meeting Created!");
            router.push(`/meeting/${meetingCode}`);

        } catch (error: any) {
            console.error("Create meeting failed", error);
            toast.error("Failed to create meeting");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
            <Toaster />
            
            {/* Background Decorative Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-indigo-100/40 blur-[130px] rounded-full animate-pulse"></div>
                <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-100/30 blur-[130px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full z-10 max-w-[440px] mx-auto">
                <div className="bg-white rounded-3xl shadow-[0_0_80px_-20px_rgba(79,70,229,0.4)] ring-1 ring-indigo-500/20 p-8 sm:p-10 opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards] relative group">
                    <div className="relative z-10">
                        <div className="text-center mb-10">
                            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/30 mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Create Meeting</h2>
                            <p className="mt-3 text-slate-500 font-medium">Launch a premium collaboration space.</p>
                        </div>

                        <form className="space-y-7" onSubmit={createMeeting}>
                            <div>
                                <label htmlFor="meeting-title" className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Meeting Subject</label>
                                <input
                                    id="meeting-title"
                                    name="title"
                                    type="text"
                                    required
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal"
                                    placeholder="e.g., Q3 Strategy Review"
                                    value={meetingTitle}
                                    onChange={(e) => setMeetingTitle(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 group/opt cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => setIsWaitingRoomEnabled(!isWaitingRoomEnabled)}>
                                <div className="flex items-center justify-center">
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isWaitingRoomEnabled ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-600/20' : 'bg-white border-slate-300'}`}>
                                        {isWaitingRoomEnabled && (
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        id="waiting-room"
                                        name="waiting-room"
                                        type="checkbox"
                                        className="hidden"
                                        checked={isWaitingRoomEnabled}
                                        onChange={(e) => setIsWaitingRoomEnabled(e.target.checked)}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="waiting-room" className="text-sm font-bold text-slate-800 cursor-pointer">
                                        Enable Waiting Room
                                    </label>
                                    <p className="text-xs text-slate-500">Only authorized guests can join.</p>
                                </div>
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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                        </svg>
                                    )}
                                    {loading ? 'Creating...' : 'Start Session'}
                                </button>
                            </div>

                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => router.push('/dashboard')}
                                    className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 mx-auto group/back"
                                >
                                    <svg className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Return to Dashboard
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
