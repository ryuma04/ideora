"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinMeeting() {
    const router = useRouter();
    const [meetingCode, setMeetingCode] = useState("");
    const [loading, setLoading] = useState(false);

    const joinMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // In a real app, you might validate the meeting code against the DB first
            if (meetingCode.trim().length < 3) {
                alert("Please enter a valid meeting code");
                return;
            }
            router.push(`/meeting/${meetingCode}`);
        } catch (error) {
            console.error("Join meeting failed", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-slate-100">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Join a Meeting</h2>
                    <p className="mt-2 text-sm text-slate-600">Enter the meeting code to join the session.</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={joinMeeting}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="meeting-code" className="sr-only">Meeting Code</label>
                            <input
                                id="meeting-code"
                                name="code"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-t-md rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Enter Meeting Code (e.g., abc-123-xyz)"
                                value={meetingCode}
                                onChange={(e) => setMeetingCode(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                } transition duration-150 ease-in-out`}
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            )}
                            {loading ? 'Joining...' : 'Join Meeting'}
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard')}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            Cancel and return to dashboard
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
