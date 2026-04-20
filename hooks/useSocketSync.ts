import { useEffect, useRef, useState, useCallback } from 'react';
import { useMaybeRoomContext } from '@livekit/components-react';
import { RoomEvent, type RemoteParticipant, type LocalParticipant } from 'livekit-client';

const BRAINSTORM_TOPIC = 'brainstorm';

// Map outgoing event names → the event name receivers listen for
const EVENT_MAP: Record<string, string> = {
    'canvas-change': 'canvas-update',
    'swot-change': 'swot-update',
    'mindmap-change': 'mindmap-update',
    'sticky-notes-change': 'sticky-notes-update',
};

/** Minimal socket-like interface so all existing brainstorming components work unchanged */
interface SocketLike {
    id: string;
    emit: (event: string, data: any) => void;
    on: (event: string, handler: (...args: any[]) => void) => void;
    off: (event: string, handler?: (...args: any[]) => void) => void;
}

/**
 * Replaces the previous Socket.io-based sync with LiveKit DataChannels.
 * 
 * The hook returns a socket-like API so brainstorming components
 * (Canvas, SWOT, Mindmap, StickyNotes) work unchanged.
 *
 * When rendered outside a <LiveKitRoom> (e.g. readOnly vault viewer),
 * it returns { socket: null } and all dependent code safely no-ops.
 */
export function useSocketSync(meetingId: string) {
    const room = useMaybeRoomContext();               // undefined when outside LiveKitRoom
    const localParticipant = room?.localParticipant ?? null;
    const isRemoteUpdate = useRef(false);

    // Registry: event name → set of handlers
    const handlersRef = useRef<Record<string, Set<(...args: any[]) => void>>>({});

    // Keep a stable ref to localParticipant so emit never goes stale
    const lpRef = useRef<LocalParticipant | null>(null);
    useEffect(() => { lpRef.current = localParticipant; }, [localParticipant]);

    // ─── emit ────────────────────────────────────────────────────────
    const emit = useCallback((event: string, data: any) => {
        const lp = lpRef.current;
        if (!lp) return;

        const receiveEvent = EVENT_MAP[event] || event;

        // Build payload: strip meetingId (room IS the meeting), attach senderId
        const { meetingId: _m, ...rest } = data;
        const payload = { event: receiveEvent, ...rest, senderId: lp.identity };

        const encoded = new TextEncoder().encode(JSON.stringify(payload));
        lp.publishData(encoded, { topic: BRAINSTORM_TOPIC, reliable: true })
            .catch((err: any) => console.warn('[brainstorm] publishData failed:', err));
    }, []);

    // ─── on / off ────────────────────────────────────────────────────
    const on = useCallback((event: string, handler: (...args: any[]) => void) => {
        if (!handlersRef.current[event]) handlersRef.current[event] = new Set();
        handlersRef.current[event].add(handler);
    }, []);

    const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
        if (!handlersRef.current[event]) return;
        if (handler) {
            handlersRef.current[event].delete(handler);
        } else {
            delete handlersRef.current[event];
        }
    }, []);

    // ─── Incoming data listener ──────────────────────────────────────
    useEffect(() => {
        if (!room) return;

        const handleDataReceived = (
            payload: Uint8Array,
            participant?: RemoteParticipant,
            _kind?: any,
            topic?: string,
        ) => {
            // Only handle our brainstorm topic
            if (topic !== BRAINSTORM_TOPIC) return;

            try {
                const decoded = JSON.parse(new TextDecoder().decode(payload));
                const { event, ...data } = decoded;

                const handlers = handlersRef.current[event];
                if (handlers) {
                    handlers.forEach(h => h(data));
                }
            } catch (e) {
                console.error('[brainstorm] Failed to decode incoming data:', e);
            }
        };

        room.on(RoomEvent.DataReceived, handleDataReceived);
        return () => { room.off(RoomEvent.DataReceived, handleDataReceived); };
    }, [room]);

    // ─── Build socket-like object ────────────────────────────────────
    const [socket, setSocket] = useState<SocketLike | null>(null);

    useEffect(() => {
        if (localParticipant) {
            setSocket({ id: localParticipant.identity, emit, on, off });
        } else {
            setSocket(null);
        }
    }, [localParticipant, emit, on, off]);

    // ─── performRemoteAction ─────────────────────────────────────────
    const performRemoteAction = useCallback((action: () => void) => {
        isRemoteUpdate.current = true;
        try {
            action();
        } finally {
            // Small delay so the resulting state update + its effects
            // see isRemoteUpdate=true before we reset it
            setTimeout(() => { isRemoteUpdate.current = false; }, 50);
        }
    }, []);

    return { socket, isRemoteUpdate, performRemoteAction };
}
