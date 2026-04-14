"use client";

import "@livekit/components-styles";
import {
    LiveKitRoom,
    useTracks,
    useLocalParticipant,
    useConnectionState,
    useParticipants,
    useChat,
    ParticipantTile,
    RoomAudioRenderer,
} from "@livekit/components-react";
import { Track, ConnectionState, RemoteParticipant } from "livekit-client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import BrainstormingSwotAnalysis from '@/app/brainstorming/brainstormingSwotAnalysis';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

const BrainstormingCanvas = dynamic(() => import('@/app/brainstorming/brainstormingCanvas').then(mod => mod.default), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center flex-col animate-pulse bg-slate-800 rounded-xl border border-slate-700">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-yellow-500 font-medium tracking-widest text-sm uppercase">Loading Canvas...</p>
        </div>
    )
});

const BrainstormingMindmapping = dynamic(() => import('@/app/brainstorming/brainstormingMindmapping').then(mod => mod.default), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center flex-col animate-pulse bg-slate-800 rounded-xl border border-slate-700">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-pink-500 font-medium tracking-widest text-sm uppercase">Mapping Thoughts...</p>
        </div>
    )
});

const BrainstormingStickyNotes = dynamic(() => import('@/app/brainstorming/brainstormingStickyNotes').then(mod => mod.default), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center flex-col animate-pulse bg-slate-800 rounded-xl border border-slate-700">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-emerald-500 font-medium tracking-widest text-sm uppercase">Preparing board...</p>
        </div>
    )
});

// Video Component to render a participant
function VideoTile({ trackRef }: { trackRef: any }) {
    const { publication, participant } = trackRef;
    // Safely check for publication
    const isVideoMuted = publication?.isMuted ?? true; // Assume muted if unsure

    // Parse metadata safely
    let metadata = { profileImage: "" };
    try {
        if (participant.metadata) {
            metadata = JSON.parse(participant.metadata);
        }
    } catch (e) { /* ignore */ }

    // Get the actual Track object if available for playing
    // Wait, trackRef contains .publication.track (if subscribed)
    // We can use the <video> element logic or use LiveKit's VideoTrack component
    // Let's stick to simple video element but handle the mute state

    return (
        <div className="relative w-full h-full bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
            {/* Video or Avatar */}
            {!isVideoMuted && publication?.track ? (
                <video
                    ref={(el) => {
                        if (el && publication.track) {
                            publication.track.attach(el);
                        }
                    }}
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror local video
                />
            ) : (
                // Avatar View
                <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50">
                    {metadata.profileImage ? (
                        <img
                            src={metadata.profileImage}
                            alt={participant.identity}
                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-md border-4 border-white">
                            {participant.identity?.slice(0, 2).toUpperCase() || "??"}
                        </div>
                    )}
                </div>
            )}

            {/* Name Tag */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-800 shadow-sm border border-slate-200 flex items-center gap-2">
                <span>{participant.identity}</span>
                {participant.isMicrophoneEnabled ? (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                ) : (
                    <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                )}
            </div>
        </div>
    );
}

// Inner Component that has access to LiveKit Context
function MeetingContent({ meetingId, meetingDbId, title, isGuest, isHost, participantId, initialRemainingTime }: {
    meetingId: string,
    meetingDbId: string,
    title: string,
    isGuest: boolean,
    isHost: boolean,
    participantId: string,
    initialRemainingTime: number
}) {
    const router = useRouter();
    const roomState = useConnectionState();
    const { localParticipant } = useLocalParticipant();

    // Get all video tracks (camera + screen share)
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: true }
    );

    // Get all participants for audio recording
    const allParticipants = useParticipants();
    const remoteParticipants = allParticipants.filter(
        (p) => p.sid !== localParticipant?.sid
    ) as RemoteParticipant[];

    // Get local audio track for recording
    const localMicTrack = localParticipant?.getTrackPublication(Track.Source.Microphone)
        ?.track?.mediaStreamTrack || null;

    // Audio recording hook (only active for host)
    const { isRecording, startRecording, stopRecording, audioContextState } = useAudioRecorder({
        meetingId,
        isHost,
        localAudioTrack: localMicTrack,
        remoteParticipants,
    });

    // Flag to prevent recording from restarting after End Meeting
    const meetingEndedRef = useRef(false);

    // Auto-start recording when host is connected
    useEffect(() => {
        if (isHost && roomState === ConnectionState.Connected && !isRecording && !meetingEndedRef.current) {
            // Small delay to let audio tracks initialize
            const timer = setTimeout(() => startRecording(), 2000);
            return () => clearTimeout(timer);
        }
    }, [isHost, roomState, isRecording, startRecording]);

    // ─── Meeting End Logic ──────────────────────────────────────────
    const handleEndMeeting = async () => {
        if (meetingEndedRef.current) return;

        try {
            console.log("Attempting to end meeting with ID:", meetingId);
            meetingEndedRef.current = true; // Stop recorder and other effects

            // 1 & 2. Back up brainstorming state permanently
            try {
                const tools = ['canvas', 'mindmapping', 'stickyNotes', 'swotAnalysis'];
                await Promise.all(
                    tools.map(async (tool) => {
                        await fetch(`/api/brainstorming/${tool}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ meetingId, action: "save_to_db" })
                        });
                        await fetch(`/api/brainstorming/${tool}?meetingId=${meetingId}`, {
                            method: 'DELETE'
                        });
                    })
                );
            } catch (e) {
                console.error("Failed to sync/clean brainstorming tools on meeting end", e);
            }

            // 3. Stop audio recording and finalize
            try {
                stopRecording();
                await new Promise(resolve => setTimeout(resolve, 1500));

                await fetch('/api/meeting/audio/finalize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ meetingId })
                });
            } catch (audioErr) {
                console.error("Audio finalization error:", audioErr);
            }

            // 4. Set meeting to ended status in DB
            const endRes = await fetch('/api/meeting/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meetingId })
            });

            if (endRes.ok) {
                router.push(isGuest ? '/' : '/dashboard');
            }
        } catch (error) {
            console.error("Error in handleEndMeeting:", error);
        }
    };

    // Timer logic
    const [secondsLeft, setSecondsLeft] = useState(initialRemainingTime);
    useEffect(() => {
        if (roomState !== ConnectionState.Connected || meetingEndedRef.current) return;

        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    if (isHost) handleEndMeeting();
                    else handleLeaveMeeting();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [roomState, isHost]);

    // Handle Leave logic securely (Click or Exit Tab)
    const handleLeaveMeeting = async () => {
        try {
            if (participantId && meetingDbId) {
                await fetch('/api/meeting/leave', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ meetingId: meetingDbId, participantId })
                });
            }
        } catch (e) {
            console.error("Failed to log leave time:", e);
        } finally {
            router.push(isGuest ? '/' : '/dashboard');
        }
    };

    // Tracking browser close via sendBeacon for guaranteed delivery
    useEffect(() => {
        if (!meetingDbId || !participantId) return;

        const handleBeforeUnload = () => {
            const data = JSON.stringify({ meetingId: meetingDbId, participantId });
            const blob = new Blob([data], { type: 'application/json' });
            navigator.sendBeacon('/api/meeting/leave', blob);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [meetingDbId, participantId]);

    // Format time (MM:SS)
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Toggle Functions
    const toggleMic = async () => {
        if (!localParticipant) return;
        if (roomState !== ConnectionState.Connected) {
            console.warn("Cannot toggle mic: Room not connected");
            return;
        }
        try {
            // If audio recording is suspended, try to resume it on first click
            if (isHost && audioContextState === 'suspended') {
                startRecording();
            }
            const isEnabled = localParticipant.isMicrophoneEnabled;
            await localParticipant.setMicrophoneEnabled(!isEnabled);
        } catch (e: any) {
            if (e.name === 'NotAllowedError' || e.message?.toLowerCase().includes('permission')) {
                alert("Microphone access was denied. Please check your browser permissions.");
            } else {
                console.error("Error toggling mic:", e);
            }
        }
    };

    const toggleCamera = async () => {
        if (!localParticipant) return;
        if (roomState !== ConnectionState.Connected) {
            console.warn("Cannot toggle camera: Room not connected");
            return;
        }
        try {
            if (isHost && audioContextState === 'suspended') {
                startRecording();
            }
            const isEnabled = localParticipant.isCameraEnabled;
            await localParticipant.setCameraEnabled(!isEnabled);
        } catch (e: any) {
            if (e.name === 'NotAllowedError' || e.message?.toLowerCase().includes('permission')) {
                alert("Camera access was denied. Please check your browser permissions.");
            } else {
                console.error("Error toggling camera:", e);
            }
        }
    };

    const toggleScreenShare = async () => {
        if (!localParticipant) return;
        if (roomState !== ConnectionState.Connected) return;
        try {
            const isEnabled = localParticipant.isScreenShareEnabled;
            await localParticipant.setScreenShareEnabled(!isEnabled);
        } catch (e) {
            console.error("Error toggling screen share:", e);
        }
    };

    // State for UI Feedback
    const [micOn, setMicOn] = useState(false);
    const [camOn, setCamOn] = useState(false);
    const [screenShareOn, setScreenShareOn] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [activeTab, setActiveTab] = useState<'participants' | 'chat'>('participants');
    const [isBrainstormingMode, setIsBrainstormingMode] = useState(false);//act as switch for going into brainstorming part

    // Track the active tool in the workspace
    const [activeWorkspaceTool, setActiveWorkspaceTool] = useState<'whiteboard' | 'swot' | 'mindmap' | 'notes'>('whiteboard');

    const [wasConnected, setWasConnected] = useState(false);
    useEffect(() => {
        if (roomState === ConnectionState.Connected) {
            setWasConnected(true);
        }

        if (roomState === ConnectionState.Disconnected && wasConnected) {
            if (!isHost) {
                // For guests/participants
                alert("The meeting has been ended by the host.");
                router.push(isGuest ? '/' : '/dashboard');
            }
        }
    }, [roomState, wasConnected, isHost, isGuest, router]);

    // Get all participants (not just those with video tracks)
    const participants = useParticipants();
    const { send, chatMessages, isSending } = useChat();
    const [draft, setDraft] = useState("");

    const handleSendChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!draft.trim() || isSending) return;
        try {
            await send(draft);
            setDraft("");
        } catch (err) {
            console.error(err);
        }
    }

    // Sync UI state with actual participant state
    useEffect(() => {
        if (localParticipant) {
            setMicOn(localParticipant.isMicrophoneEnabled);
            setCamOn(localParticipant.isCameraEnabled);
            setScreenShareOn(localParticipant.isScreenShareEnabled);
        }
    }, [localParticipant, localParticipant?.isMicrophoneEnabled, localParticipant?.isCameraEnabled, localParticipant?.isScreenShareEnabled]);

    // ==========================================
    // WAITING ROOM HOST LOGIC
    // ==========================================
    const [waitingParticipants, setWaitingParticipants] = useState<any[]>([]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isHost && showParticipants && meetingDbId) {
            const fetchWaitingRoom = async () => {
                try {
                    const res = await fetch(`/api/meeting/waitingRoom?meetingId=${meetingDbId}`);
                    const data = await res.json();
                    if (data.success) {
                        setWaitingParticipants(data.waitingParticipants);
                    }
                } catch (e) {
                    console.error("Failed to fetch waiting room", e);
                }
            };

            fetchWaitingRoom(); // Initial fetch
            interval = setInterval(fetchWaitingRoom, 5000); // Poll every 5 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isHost, showParticipants, meetingDbId]);

    const handleWaitingRoomAction = async (participantId: string, action: 'admit' | 'deny') => {
        try {
            const res = await fetch(`/api/meeting/waitingRoom`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meetingId: meetingDbId, participantId, action })
            });
            const data = await res.json();
            if (data.success) {
                // Remove from local list immediately for better UX
                setWaitingParticipants(prev => prev.filter(p => p._id !== participantId));
            } else {
                console.error("Action failed:", data.error);
            }
        } catch (e) {
            console.error("Failed to perform action", e);
        }
    };
    // ==========================================


    const copyInvite = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        // Using alert for simplicity, could use toast.success if toaster is available in this component context
        // Ideally pass toast down or use a global context
        // Since toast import might be missing in this inner component, let's try window.alert or console log visually
        // Actually, we can just use a temporary state to show "Copied!" text on the button
    };

    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-screen bg-[#FAFAFA] text-slate-900 font-sans relative">
            {/* Header */}
            <header className="px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-200 z-10">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">{title || `Meeting: ${meetingId}`}</h1>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${roomState === ConnectionState.Connected ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></span>
                                <span className="text-xs text-slate-400 font-medium">
                                    {roomState === ConnectionState.Connected ? 'Live' : 'Connecting...'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-700/50 hidden md:block"></div>

                    {/* Timer Display */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm ${secondsLeft < 300 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-600'} transition-colors duration-300`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="font-mono font-bold text-sm tracking-wider">
                            {formatTime(secondsLeft)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCopy}
                        className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-600 flex items-center gap-2"
                    >
                        {copied ? (
                            <>
                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                Copy Invite
                            </>
                        )}
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold border-2 border-slate-800">
                        You
                    </div>
                </div>
            </header>

            {/* Main Content Area with Sidebar */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video Grid */}
                <main className={`flex-1 overflow-hidden transition-all duration-300 ${isBrainstormingMode ? 'p-2' : 'p-6'} ${showParticipants ? 'mr-0' : ''}`}>
                    {isBrainstormingMode ? (
                        <div className="flex h-full gap-2 relative">
                            {/* Workspace Sidebar Tools (Absolute positioning so it floats over canvas if necessary or sits beside) */}
                            <div className="w-16 flex flex-col items-center py-4 bg-slate-800 rounded-xl border border-slate-700 shadow-xl gap-4 z-20 shrink-0">
                                <button
                                    onClick={() => setActiveWorkspaceTool('whiteboard')}
                                    className={`p-3 rounded-lg transition-all ${activeWorkspaceTool === 'whiteboard' ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                    title="Whiteboard"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button
                                    onClick={() => setActiveWorkspaceTool('swot')}
                                    className={`p-3 rounded-lg transition-all ${activeWorkspaceTool === 'swot' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                    title="SWOT Analysis"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                </button>
                                <button
                                    onClick={() => setActiveWorkspaceTool('mindmap')}
                                    className={`p-3 rounded-lg transition-all ${activeWorkspaceTool === 'mindmap' ? 'bg-pink-500/20 text-pink-400' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                    title="Mind Mapping"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                </button>
                                <button
                                    onClick={() => setActiveWorkspaceTool('notes')}
                                    className={`p-3 rounded-lg transition-all ${activeWorkspaceTool === 'notes' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                    title="Sticky Notes"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                </button>
                            </div>

                            {/* 1. Primary Canvas Area (Flex 1 ensures it fills remaining space besides the toolbar and PiP) */}
                            <div className="flex-1 bg-slate-800/80 rounded-xl flex items-center justify-center overflow-hidden relative shadow-lg">
                                {activeWorkspaceTool === 'whiteboard' && <BrainstormingCanvas meetingId={meetingId} />}
                                {activeWorkspaceTool === 'swot' && <BrainstormingSwotAnalysis meetingId={meetingId} />}
                                {activeWorkspaceTool === 'mindmap' && <BrainstormingMindmapping meetingId={meetingId} />}
                                {activeWorkspaceTool === 'notes' && <BrainstormingStickyNotes meetingId={meetingId} />}
                            </div>

                            {/* 2. PiP Video Column (less width) */}
                            <div className="w-48 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1">
                                {tracks.map((trackRef) => (
                                    <div key={`${trackRef.participant.sid}-${trackRef.source}`} className="h-32 shrink-0">
                                        <VideoTile trackRef={trackRef} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {tracks.length === 0 ? (
                                // Empty State / Local User Only view if track isn't ready
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-4 border border-slate-700 animate-pulse">
                                        <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </div>
                                    <p>Waiting for others to join...</p>
                                </div>
                            ) : (
                                <div className={`grid gap-4 w-full h-full ${tracks.length === 1 ? 'grid-cols-1' :
                                    tracks.length === 2 ? 'grid-cols-2' :
                                        'grid-cols-2 md:grid-cols-3'
                                    }`}>
                                    {tracks.map((trackRef) => (
                                        <VideoTile
                                            key={`${trackRef.participant.sid}-${trackRef.source}`}
                                            trackRef={trackRef}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </main>

                {/* Sidebar (Participants & Chat) */}
                {showParticipants && (
                    <aside className="w-80 bg-white/80 backdrop-blur-xl border-l border-slate-200 flex flex-col h-full animate-in slide-in-from-right duration-300">

                        {/* Tabs Header */}
                        <div className="flex items-center border-b border-slate-200">
                            <button
                                onClick={() => setActiveTab('participants')}
                                className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${activeTab === 'participants' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                            >
                                Participants ({participants.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${activeTab === 'chat' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                            >
                                Chat
                            </button>
                            <button onClick={() => setShowParticipants(false)} className="px-4 text-slate-400 hover:text-slate-900">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {activeTab === 'participants' ? (
                                <div className="space-y-6">
                                    {/* Waiting Room Section (Host Only) */}
                                    {isHost && waitingParticipants.length > 0 && (
                                        <div className="bg-slate-700/40 rounded-xl border border-yellow-500/30 overflow-hidden">
                                            <div className="bg-yellow-500/10 px-4 py-2 border-b border-yellow-500/20 flex justify-between items-center">
                                                <h3 className="text-yellow-400 font-semibold text-sm flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    Waiting Room ({waitingParticipants.length})
                                                </h3>
                                            </div>
                                            <div className="p-2 space-y-2">
                                                {waitingParticipants.map(wp => (
                                                    <div key={wp._id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                                                                {wp.name?.slice(0, 2).toUpperCase() || "??"}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-sm truncate">{wp.name}</p>
                                                                {wp.isGuest && <p className="text-[10px] text-slate-400">Guest</p>}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 shrink-0">
                                                            <button
                                                                onClick={() => handleWaitingRoomAction(wp._id, 'admit')}
                                                                className="px-2 py-1 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded text-xs transition-colors"
                                                            >
                                                                Admit
                                                            </button>
                                                            <button
                                                                onClick={() => handleWaitingRoomAction(wp._id, 'deny')}
                                                                className="px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded text-xs transition-colors"
                                                            >
                                                                Deny
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Active Participants */}
                                    <div>
                                        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 px-1">In Meeting</h3>
                                        <div className="space-y-2">
                                            {participants.map((p) => {
                                                let metadata = { profileImage: "" };
                                                try { if (p.metadata) metadata = JSON.parse(p.metadata); } catch (e) { }
                                                return (
                                                    <div key={p.sid} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors shadow-sm">
                                                        {metadata.profileImage ? (
                                                            <img src={metadata.profileImage} alt={p.identity} className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-sm" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm border border-indigo-500">
                                                                {p.identity?.slice(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm text-slate-900 truncate">{p.identity} {p === localParticipant && "(You)"}</p>
                                                            {isHost && p === localParticipant && <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-widest mt-0.5">Host</p>}
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {p.isMicrophoneEnabled ? (
                                                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                                            ) : (
                                                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Chat Tab
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 space-y-4 mb-4">
                                        {chatMessages.length === 0 ? (
                                            <div className="text-center text-slate-500 mt-10">
                                                <p className="text-sm">No messages yet.</p>
                                                <p className="text-xs">Start the conversation!</p>
                                            </div>
                                        ) : (
                                            chatMessages.map((msg, idx) => {
                                                const isMe = msg.from === localParticipant;
                                                return (
                                                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm border border-transparent ${isMe ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-500/20' : 'bg-white text-slate-800 border-slate-200 rounded-bl-none shadow-black/5'
                                                            }`}>
                                                            {msg.message}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                                                            {isMe ? 'You' : msg.from?.identity} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    <form onSubmit={handleSendChat} className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex gap-2">
                                        <input
                                            type="text"
                                            value={draft}
                                            onChange={(e) => setDraft(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 placeholder-slate-400 px-2"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!draft.trim() || isSending}
                                            className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </aside>
                )}
            </div>

            {/* Premium Control Bar */}
            <footer className={`${isBrainstormingMode ? 'h-20 pb-2' : 'h-24 pb-4'} bg-white/90 backdrop-blur-xl border-t border-slate-200 flex items-center justify-center gap-8 transition-all duration-300`}>
                <div className={`flex items-center gap-6 bg-slate-50 ${isBrainstormingMode ? 'px-6 py-2' : 'px-8 py-4'} rounded-2xl border border-slate-200 shadow-lg transition-all duration-300`}>
                    <button
                        onClick={toggleMic}
                        className={`p-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-sm border ${micOn
                            ? 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                            : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                            }`}
                    >
                        {micOn ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                        )}
                    </button>

                    <button
                        onClick={toggleCamera}
                        className={`p-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-sm border ${camOn
                            ? 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                            : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                            }`}
                    >
                        {camOn ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                        )}
                    </button>

                    {/* Screen Share Button - Hide for Guests */}
                    {!isGuest && (
                        <button
                            onClick={toggleScreenShare}
                            className={`p-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-sm border ${screenShareOn
                                ? 'bg-indigo-600 text-white border-transparent hover:bg-indigo-500 shadow-indigo-500/30'
                                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                                }`}
                            title="Share Screen"
                        >
                            {screenShareOn ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            )}
                        </button>
                    )}

                    {/* Participants Toggle Button */}
                    <button
                        onClick={() => setShowParticipants(!showParticipants)}
                        className={`relative p-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-sm border ${showParticipants
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200 ring-2 ring-inset ring-indigo-500'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                            }`}
                        title="Participants"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                            {participants.length}
                        </span>
                    </button>

                    {/* Recording Indicator (Host Only) */}
                    {isHost && (
                        <button
                            onClick={() => audioContextState === 'suspended' ? startRecording() : null}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${isRecording && audioContextState === 'running'
                                ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                                : 'bg-slate-100 border-slate-200 text-slate-500'
                                }`}
                            title={audioContextState === 'suspended' ? 'Click to enable recording' : 'Recording Status'}
                        >
                            <div className={`w-2 h-2 rounded-full ${isRecording && audioContextState === 'running' ? 'bg-red-500' : 'bg-slate-500'}`}></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                {isRecording && audioContextState === 'running' ? 'REC' : audioContextState === 'suspended' ? 'REC (Paused)' : 'REC (Standby)'}
                            </span>
                        </button>
                    )}

                    <button
                        onClick={() => setIsBrainstormingMode(!isBrainstormingMode)}
                        className={`relative p-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-sm border ${isBrainstormingMode
                            ? 'bg-yellow-50 text-yellow-600 border-yellow-200 ring-2 ring-inset ring-yellow-500'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                            }`}
                        title="Brainstorming Mode"
                    >
                        {/* brainstorming icon bulb */}
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        <span className="absolute -top-1 -right-2 flex h-4 px-1.5 min-w-[20px] items-center justify-center rounded-full bg-yellow-500 text-[10px] text-white font-bold">
                            {isBrainstormingMode ? 'On' : 'Off'}
                        </span>
                    </button>
                    <div className="w-px h-10 bg-slate-200 mx-2"></div>

                    {isHost ? (
                        <button
                            onClick={() => {
                                if (confirm("Are you sure you want to end this meeting for everyone?")) {
                                    handleEndMeeting();
                                }
                            }}
                            className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold flex items-center gap-3 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-red-500/30"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            End Meeting
                        </button>
                    ) : (
                        <button
                            onClick={handleLeaveMeeting}
                            className="px-8 py-4 bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold flex items-center gap-3 transition-all duration-200 transform hover:scale-105 shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Leave
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
}

// Main Page Component
export default function MeetingRoom() {
    const params = useParams<{ id: string }>();
    const meetingId = params.id;
    const router = useRouter();

    const [token, setToken] = useState("");
    const [meeting, setMeeting] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isGuest, setIsGuest] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [participantId, setParticipantId] = useState("");
    const [initialRemainingTime, setInitialRemainingTime] = useState(1800); // Default to 30 mins
    const [isWaitingInRoom, setIsWaitingInRoom] = useState(false); // Waiting Room State

    const [scheduledTime, setScheduledTime] = useState<Date | null>(null);

    const fetchMeetingAndToken = async () => {
        try {
            // Fetch meeting details
            const meetingRes = await fetch(`/api/meeting/${meetingId}`);
            const meetingData = await meetingRes.json();

            if (!meetingRes.ok) {
                throw new Error(meetingData.error || "Failed to join meeting");
            }
            setMeeting(meetingData.meeting);

            if (meetingData.meeting.status === 'ended') {
                setError("This meeting has ended.");
                setLoading(false);
                return;
            }

            // Check if meeting is scheduled in the future
            if (meetingData.meeting.status === 'upcoming') {
                const startTime = new Date(meetingData.meeting.startTime);
                if (startTime > new Date()) {
                    setScheduledTime(startTime);
                    setLoading(false);
                    return;
                }
            }

            // Get or create a persistent guest ID
            let storedGuestId = localStorage.getItem('guest_device_id');
            if (!storedGuestId) {
                storedGuestId = `guest-${Math.random().toString(36).substring(2, 8)}`;
                localStorage.setItem('guest_device_id', storedGuestId);
            }

            // Fetch LiveKit token
            const tokenRes = await fetch(`/api/meeting/livekit/token?room=${meetingData.meeting._id}&guestId=${storedGuestId}`);
            const tokenData = await tokenRes.json();

            if (!tokenRes.ok) {
                if (tokenRes.status === 403 && tokenData.status === "denied") {
                    setError(tokenData.error || "Entry denied by host.");
                    setIsWaitingInRoom(false);
                    return;
                }
                throw new Error(tokenData.error || "Failed to get access token");
            }

            if (tokenData.status === "waiting") {
                setIsWaitingInRoom(true);
                return;
            }

            // If admitted or normal entry
            setIsWaitingInRoom(false);
            setToken(tokenData.token);
            setIsGuest(tokenData.user?.isGuest || false);
            setIsHost(tokenData.user?.isHost || false);
            setParticipantId(tokenData.user?.participantId || "");
            setInitialRemainingTime(tokenData.remainingTimeSeconds || 1800);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (meetingId) {
            fetchMeetingAndToken();
        }
    }, [meetingId]);

    // Polling effect for waiting room
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isWaitingInRoom) {
            interval = setInterval(() => {
                fetchMeetingAndToken();
            }, 5000); // Poll every 5 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isWaitingInRoom, meetingId]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
                <div className="flex flex-col items-center animate-pulse">
                    <div className="w-full text-center">
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 mb-4">Ideora</h2>
                    </div>
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-medium">Entering secure room...</p>
                </div>
            </div>
        );
    }

    if (isWaitingInRoom) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
                <div className="flex flex-col items-center animate-pulse">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">You are in the waiting room</h2>
                    <p className="text-slate-400 font-medium text-center max-w-sm">
                        Please wait, the meeting host will let you in soon.
                    </p>
                </div>
            </div>
        );
    }

    if (scheduledTime) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
                <div className="text-center max-w-md p-8 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Meeting Scheduled</h2>
                    <p className="text-slate-400 mb-6">This meeting is scheduled for:</p>
                    <div className="bg-slate-900 rounded-lg p-4 mb-6 border border-slate-700">
                        <p className="text-xl font-bold text-white">
                            {scheduledTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-2xl font-bold text-indigo-400 mt-1">
                            {scheduledTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (error) {
        return ( // Error UI remains the same
            <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
                <div className="text-center max-w-md p-8 bg-slate-800 rounded-xl border border-slate-700">
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-2xl font-bold mb-2">Unavailable</h2>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <LiveKitRoom
            video={false} // Connect first, then let user enable
            audio={false}
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            className="h-full w-full bg-slate-900"
        >
            <RoomAudioRenderer />
            <MeetingContent
                meetingId={meetingId || ""}
                meetingDbId={meeting?._id}
                title={meeting?.title}
                isGuest={isGuest}
                isHost={isHost}
                participantId={participantId}
                initialRemainingTime={initialRemainingTime}
            />
        </LiveKitRoom>
    );
}
