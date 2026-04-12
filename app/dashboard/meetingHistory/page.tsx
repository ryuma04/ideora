"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MeetingHistory() {
    const router = useRouter();
    const [user, setUser] = useState({ username: "Username", profileImage: "" });
    const [meetings, setMeetings] = useState<any[]>([]);
    
    const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
    const [attendanceData, setAttendanceData] = useState<any>(null);
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    const handleViewAttendance = async (e: React.MouseEvent, meetingId: string) => {
        e.stopPropagation();
        setAttendanceModalOpen(true);
        setAttendanceLoading(true);
        try {
            const res = await fetch(`/api/meeting/attendance/${meetingId}`);
            const data = await res.json();
            if (data.success) {
                setAttendanceData(data);
            } else {
                alert(data.error || "Failed to load attendance");
                setAttendanceModalOpen(false);
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong");
            setAttendanceModalOpen(false);
        } finally {
            setAttendanceLoading(false);
        }
    };

    useEffect(() => {
        const getData = async () => {
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

                // Fetch meetings
                const meetingRes = await fetch('/api/meeting/list');
                const meetingData = await meetingRes.json();
                if (meetingData.success) {
                    setMeetings(meetingData.meetings);
                }

            } catch (error) {
                console.error("Failed to fetch history data", error);
            }
        };
        getData();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
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

                    <button onClick={() => router.push('/dashboard/mom')} className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        MOM
                    </button>

                    <button className="w-full flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Meeting History
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
                <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-slate-900">Meeting History</h1>
                    <img
                        src={user.profileImage || "/profile_image.png"}
                        alt="Profile"
                        onClick={() => router.push('/dashboard/profile')}
                        className="w-12 h-12 rounded-full cursor-pointer hover:opacity-80 object-cover"
                    />
                </header>

                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Your Previous Meetings</h2>
                    </div>

                    <div className="space-y-4">
                        {meetings.length > 0 ? (
                            meetings.map((meeting: any) => (
                                <div
                                    key={meeting._id}
                                    onClick={() => {
                                        if (meeting.status !== 'ended' && meeting.status !== 'cancelled') {
                                            router.push(`/meeting/${meeting._id}`);
                                        }
                                    }}
                                    className={`bg-white rounded-lg border border-slate-200 p-6 flex items-center justify-between transition-all shadow-sm hover:shadow-md ${meeting.status !== 'ended' && meeting.status !== 'cancelled' ? 'cursor-pointer hover:border-indigo-300' : 'cursor-default opacity-75'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl ${meeting.status === 'ended' || meeting.status === 'cancelled'
                                            ? 'bg-slate-100 text-slate-400'
                                            : 'bg-indigo-50 text-indigo-600'
                                            }`}>
                                            {meeting.title.charAt(0).toUpperCase()}
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500 font-medium mb-1">
                                                {meeting.status === 'upcoming' ? (
                                                    <span className="text-indigo-600 font-bold">
                                                        Scheduled: {new Date(meeting.startTime).toLocaleString(undefined, {
                                                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                ) : meeting.status === 'ended' ? (
                                                    <span>Ended: {new Date(meeting.createdAt).toLocaleDateString()}</span>
                                                ) : (
                                                    new Date(meeting.createdAt).toLocaleDateString(undefined, {
                                                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })
                                                )}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <h3 className={`text-lg font-bold ${meeting.status === 'ended' ? 'text-slate-500' : 'text-slate-800'}`}>{meeting.title}</h3>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${meeting.myRole === 'host'
                                                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                    }`}>
                                                    {meeting.myRole}
                                                </span>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${meeting.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                    meeting.status === 'upcoming' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                        meeting.status === 'ended' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                            'bg-slate-100 text-slate-600 border border-slate-200'
                                                    }`}>
                                                    {meeting.status}
                                                </span>
                                            </div>
                                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">
                                                Code: {meeting.meetingCode}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {meeting.status === 'ended' && meeting.myRole === 'host' && (
                                            <button 
                                                onClick={(e) => handleViewAttendance(e, meeting._id)}
                                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                            >
                                                <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                Attendance
                                            </button>
                                        )}
                                        {meeting.status !== 'ended' && meeting.status !== 'cancelled' && (
                                            <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
                                                Join
                                            </button>
                                        )}
                                    </div>

                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-slate-200 border-dashed">
                                <svg className="w-12 h-12 mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-lg font-medium text-slate-600">No meetings done</p>
                                <p className="text-sm text-slate-500">Create a new meeting to get started</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Attendance Modal */}
            {attendanceModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Meeting Attendance</h3>
                                { attendanceData?.meeting?.title && (
                                    <p className="text-sm text-slate-500 mt-1">{attendanceData.meeting.title}</p>
                                )}
                            </div>
                            <button onClick={() => setAttendanceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                            {attendanceLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            ) : attendanceData?.attendance?.length > 0 ? (
                                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined Time</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Left Time</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {attendanceData.attendance.map((participant: any) => {
                                                const joined = new Date(participant.joinedAt);
                                                const left = new Date(participant.leftAt);
                                                const durationMs = left.getTime() - joined.getTime();
                                                const durationMins = Math.max(1, Math.round(durationMs / 60000));

                                                return (
                                                    <tr key={participant._id} className="hover:bg-slate-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                                                                    {participant.name?.substring(0, 2)}
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-slate-900">{participant.name}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                            {participant.email}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${participant.role === 'host' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}`}>
                                                                {participant.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                            {joined.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                            {left.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                                                            {durationMins} min{durationMins !== 1 ? 's' : ''}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-slate-500">No verifiable attendance records found for this meeting.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
