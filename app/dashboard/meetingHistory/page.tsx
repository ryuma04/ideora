"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MeetingHistory() {
    const router = useRouter();
    const [user, setUser] = useState({ username: "Username", profileImage: "" });
    const [meetings, setMeetings] = useState<any[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
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

    const handleShareMeeting = (e: React.MouseEvent, meeting: any) => {
        e.stopPropagation();
        const origin = window.location.origin;
        const meetingLink = `${origin}/meeting/${meeting._id}`;
        
        const dateStr = meeting.status === 'upcoming' 
            ? new Date(meeting.startTime).toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : new Date(meeting.createdAt).toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        const inviteText = `Join Meeting: ${meeting.title}\n`
            + `Host: ${meeting.host || 'Unknown'}\n`
            + `Description: ${meeting.description || 'No description provided'}\n`
            + `Date & Time: ${dateStr}\n`
            + `Meeting Link: ${meetingLink}\n`
            + `Meeting Code: ${meeting.meetingCode}`;

        navigator.clipboard.writeText(inviteText)
            .then(() => {
                alert("Meeting invitation copied to clipboard!");
            })
            .catch(err => {
                console.error("Failed to copy text: ", err);
                alert("Failed to copy invitation");
            });
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

                    <button onClick={() => router.push('/dashboard/mom')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 rounded-xl hover:bg-slate-100/80 hover:text-slate-900 font-medium transition-all active:scale-[0.98]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        MOM
                    </button>

                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50/60 text-indigo-700 rounded-xl font-semibold border border-indigo-100/50 transition-all shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Meeting History
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
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
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">Meeting History</h1>
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

                <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full overflow-y-auto animate-[fade-in-up_0.6s_ease-out_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Your Previous Meetings</h2>
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
                                    className={`bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm ${meeting.status !== 'ended' && meeting.status !== 'cancelled' ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md' : 'cursor-default opacity-75'}`}
                                >
                                    <div className="flex items-center gap-4 sm:gap-5">
                                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm shrink-0 ${meeting.status === 'ended' || meeting.status === 'cancelled'
                                            ? 'bg-slate-50 text-slate-400 border border-slate-200'
                                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                            }`}>
                                            {meeting.title.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-[10px] sm:text-xs text-slate-500 font-bold mb-1 truncate">
                                                {meeting.status === 'upcoming' ? (
                                                    <span className="text-indigo-600">
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
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className={`text-base sm:text-lg font-bold truncate ${meeting.status === 'ended' ? 'text-slate-500' : 'text-slate-900'}`}>{meeting.title}</h3>
                                                <div className="flex gap-1.5 shrink-0">
                                                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${meeting.myRole === 'host'
                                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm shadow-indigo-500/10'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                                        }`}>
                                                        {meeting.myRole}
                                                    </span>
                                                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${meeting.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-500/10' :
                                                        meeting.status === 'upcoming' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-500/10' :
                                                            meeting.status === 'ended' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                'bg-slate-50 text-slate-600 border-slate-200'
                                                        }`}>
                                                        {meeting.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 mt-1.5 inline-block font-mono font-bold tracking-wider">
                                                CODE: {meeting.meetingCode}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 self-end sm:self-center">
                                        {meeting.status === 'ended' && meeting.myRole === 'host' && (
                                            <button 
                                                onClick={(e) => handleViewAttendance(e, meeting._id)}
                                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-sm active:scale-95"
                                            >
                                                <svg className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                Log
                                            </button>
                                        )}
                                        {meeting.status !== 'ended' && meeting.status !== 'cancelled' && (
                                            <>
                                                <button 
                                                    onClick={(e) => handleShareMeeting(e, meeting)}
                                                    className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                                    Share Meeting
                                                </button>
                                                <button className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 active:scale-95">
                                                    Join Now
                                                </button>
                                            </>
                                        )}
                                    </div>

                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed px-6 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-lg font-bold text-slate-600">No History Available</p>
                                <p className="text-sm text-slate-400 font-medium mt-1">Start your first meeting to see it here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Attendance Modal */}
            {attendanceModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 border border-slate-200">
                        <div className="flex justify-between items-center p-6 sm:p-8 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Attendance Log</h3>
                                { attendanceData?.meeting?.title && (
                                    <p className="text-sm text-slate-500 mt-1 font-medium">{attendanceData.meeting.title}</p>
                                )}
                            </div>
                            <button onClick={() => setAttendanceModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                            {attendanceLoading ? (
                                <div className="flex justify-center items-center py-20">
                                    <svg className="animate-spin h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            ) : attendanceData?.attendance?.length > 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-100">
                                            <thead className="bg-slate-50/50">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Participant</th>
                                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest sm:table-cell hidden">Role</th>
                                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Duration</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-50">
                                                {attendanceData.attendance.map((participant: any) => {
                                                    const joined = new Date(participant.joinedAt);
                                                    const left = new Date(participant.leftAt);
                                                    const durationMs = left.getTime() - joined.getTime();
                                                    const durationMins = Math.max(1, Math.round(durationMs / 60000));

                                                    return (
                                                        <tr key={participant._id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="hidden sm:flex shrink-0 w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                                                                        {participant.name?.substring(0, 2)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-bold text-slate-900">{participant.name}</div>
                                                                        <div className="text-[10px] text-slate-400 font-medium">{participant.email}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 sm:table-cell hidden">
                                                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${participant.role === 'host' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                                    {participant.role}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-bold text-slate-900">{durationMins} min{durationMins !== 1 ? 's' : ''}</div>
                                                                <div className="text-[10px] text-slate-400 font-medium">
                                                                    {joined.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {left.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 px-6">
                                    <p className="text-lg font-bold text-slate-500">No Attendance Found</p>
                                    <p className="text-sm text-slate-400 mt-1 font-medium">Verified logs are only available for concluded meetings.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
