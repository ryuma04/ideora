"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function CreateMeeting() {
    const router = useRouter();
    const [meetingTitle, setMeetingTitle] = useState("");
    const [isWaitingRoomEnabled, setIsWaitingRoomEnabled] = useState(false);
    const [loading, setLoading] = useState(false);

    const createMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);

            // Generate a random meeting ID (or call backend)
            // For now, let's create a random 9-digit code in groups of 3
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-slate-100">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Create a New Meeting</h2>
                    <p className="mt-2 text-sm text-slate-600">Start an instant meeting or schedule for later.</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={createMeeting}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="meeting-title" className="sr-only">Meeting Title</label>
                            <input
                                id="meeting-title"
                                name="title"
                                type="text"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Enter Meeting Topic (e.g., Project Sync)"
                                value={meetingTitle}
                                onChange={(e) => setMeetingTitle(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            id="waiting-room"
                            name="waiting-room"
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={isWaitingRoomEnabled}
                            onChange={(e) => setIsWaitingRoomEnabled(e.target.checked)}
                        />
                        <label htmlFor="waiting-room" className="ml-2 block text-sm text-slate-900">
                            Enable Waiting Room (Require host to admit participants)
                        </label>
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
                            {loading ? 'Creating...' : 'Start Meeting'}
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
