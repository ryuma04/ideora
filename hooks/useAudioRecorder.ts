// Custom hook for recording meeting audio (host-only)
// Uses Web Audio API to mix local mic + remote participant audio tracks
// Records in 10s chunks and uploads each to GridFS via the backend API

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { RemoteParticipant, RemoteTrackPublication, Track } from "livekit-client";

interface UseAudioRecorderOptions {
    meetingId: string;
    isHost: boolean;
    localAudioTrack: MediaStreamTrack | null;
    remoteParticipants: RemoteParticipant[];
}

export function useAudioRecorder({
    meetingId,
    isHost,
    localAudioTrack,
    remoteParticipants,
}: UseAudioRecorderOptions) {
    const audioContextRef = useRef<AudioContext | null>(null);
    const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunkIndexRef = useRef(0);
    const connectedTracksRef = useRef<Set<string>>(new Set());
    const [isRecording, setIsRecording] = useState(false);
    const [audioContextState, setAudioContextState] = useState<AudioContextState>("suspended");

    // Upload a single chunk to the backend
    const uploadChunk = useCallback(async (blob: Blob, index: number) => {
        try {
            const formData = new FormData();
            formData.append("chunk", blob, `chunk_${index}.webm`);
            formData.append("meetingId", meetingId);
            formData.append("chunkIndex", index.toString());

            const res = await fetch("/api/meeting/audio/chunk", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`Failed to upload chunk ${index} (Status: ${res.status}):`, errorText);
            } else {
                console.log(`Audio chunk ${index} uploaded successfully`);
            }
        } catch (err) {
            console.error(`Error uploading chunk ${index}:`, err);
        }
    }, [meetingId]);

    // Connect a MediaStreamTrack to the AudioContext mixer
    const connectTrackToMixer = useCallback((track: MediaStreamTrack, trackId: string) => {
        if (!audioContextRef.current || !destinationRef.current) return;
        if (connectedTracksRef.current.has(trackId)) return;

        try {
            const stream = new MediaStream([track]);
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(destinationRef.current);
            connectedTracksRef.current.add(trackId);
            console.log(`Connected audio track to mixer: ${trackId}`);
        } catch (err) {
            console.error(`Failed to connect track ${trackId}:`, err);
        }
    }, []);

    // Start recording
    const startRecording = useCallback(() => {
        if (!isHost || isRecording) return;

        try {
            console.log("Initializing AudioContext for recording...");
            // Create AudioContext and destination for mixing
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error("Web Audio API not supported in this browser");
            }
            
            const audioContext = new AudioContextClass({ sampleRate: 16000 });
            setAudioContextState(audioContext.state);

            // Listen for state changes
            audioContext.onstatechange = () => {
                console.log("AudioContext state changed to:", audioContext.state);
                setAudioContextState(audioContext.state);
            };
            
            // Resume if suspended (common in Chrome/Safari)
            if (audioContext.state === 'suspended') {
                console.log("AudioContext is suspended, attempting to resume...");
                audioContext.resume().catch((e: any) => console.warn("Initial resume failed (user gesture required):", e));
            }

            const destination = (audioContext as any).createMediaStreamDestination
                ? (audioContext as any).createMediaStreamDestination()
                : audioContext.createMediaStreamDestination();

            audioContextRef.current = audioContext;
            destinationRef.current = destination;
            connectedTracksRef.current.clear();
            chunkIndexRef.current = 0;
            console.log("AudioContext state:", audioContext.state);

            // Connect local mic if available
            if (localAudioTrack) {
                connectTrackToMixer(localAudioTrack, "local-mic");
            }

            // Connect all current remote participant audio tracks
            remoteParticipants.forEach((participant) => {
                participant.audioTrackPublications.forEach((pub: RemoteTrackPublication) => {
                    if (pub.track && pub.track.mediaStreamTrack) {
                        connectTrackToMixer(
                            pub.track.mediaStreamTrack,
                            `${participant.sid}-${pub.trackSid}`
                        );
                    }
                });
            });

            // Create MediaRecorder on the mixed stream
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") 
                ? "audio/webm;codecs=opus" 
                : "audio/webm";
                
            console.log(`Starting MediaRecorder with mimeType: ${mimeType}`);
            const recorder = new MediaRecorder(destination.stream, { mimeType });

            recorder.ondataavailable = (event) => {
                console.log(`MediaRecorder data available: ${event.data.size} bytes`);
                if (event.data.size > 0) {
                    const currentIndex = chunkIndexRef.current;
                    chunkIndexRef.current++;
                    uploadChunk(event.data, currentIndex);
                }
            };
            
            recorder.onstart = () => console.log("MediaRecorder started");
            recorder.onstop = () => console.log("MediaRecorder stopped");

            recorder.onerror = (event: any) => {
                console.error("MediaRecorder error:", event.error);
            };

            // Start recording with 10-second timeslice
            recorder.start(10000);
            recorderRef.current = recorder;
            setIsRecording(true);

            console.log("Audio recording started for meeting:", meetingId);
        } catch (err) {
            console.error("Failed to start audio recording:", err);
        }
    }, [isHost, isRecording, localAudioTrack, remoteParticipants, meetingId, connectTrackToMixer, uploadChunk]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (recorderRef.current && recorderRef.current.state !== "inactive") {
            recorderRef.current.stop();
            console.log("Audio recording stopped");
        }

        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            audioContextRef.current.close();
        }

        recorderRef.current = null;
        audioContextRef.current = null;
        destinationRef.current = null;
        connectedTracksRef.current.clear();
        setIsRecording(false);
        setAudioContextState("closed");
    }, []);

    // Dynamically connect new remote participants' audio tracks
    useEffect(() => {
        if (!isRecording || !audioContextRef.current || !destinationRef.current) return;

        remoteParticipants.forEach((participant) => {
            participant.audioTrackPublications.forEach((pub: RemoteTrackPublication) => {
                if (pub.track && pub.track.mediaStreamTrack) {
                    const trackId = `${participant.sid}-${pub.trackSid}`;
                    connectTrackToMixer(pub.track.mediaStreamTrack, trackId);
                }
            });
        });
    }, [isRecording, remoteParticipants, connectTrackToMixer]);

    // Connect local mic if it becomes available after recording starts
    useEffect(() => {
        if (!isRecording || !localAudioTrack) return;
        connectTrackToMixer(localAudioTrack, "local-mic");
    }, [isRecording, localAudioTrack, connectTrackToMixer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recorderRef.current && recorderRef.current.state !== "inactive") {
                recorderRef.current.stop();
            }
            if (audioContextRef.current && audioContextRef.current.state !== "closed") {
                audioContextRef.current.close();
            }
        };
    }, []);

    return {
        isRecording,
        startRecording,
        stopRecording,
        audioContextState,
        chunkCount: chunkIndexRef.current,
    };
}
