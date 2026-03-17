"use client";

import { Tldraw, Editor, getSnapshot, loadSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { useEffect, useState, useCallback, useRef } from "react";
import { useLocalParticipant, useDataChannel } from "@livekit/components-react";

interface CanvasProps {
    meetingId: string;
}

export default function BrainstormingCanvas({ meetingId }: CanvasProps) {
    const [editor, setEditor] = useState<Editor | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { localParticipant } = useLocalParticipant();

    const handleMount = useCallback((editor: Editor) => {
        setEditor(editor);
        editor.user.updateUserPreferences({ colorScheme: 'dark' });

        // Fetch initial state
        fetch(`/api/brainstorming/canvas?meetingId=${meetingId}`)
            .then(res => res.json())
            .then(data => {
                if (data.state) {
                    try {
                        const parsedState = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
                        if (parsedState.store) {    
                            // Make sure to extract just the record states if nested. 
                            const records = Object.values(parsedState.store) as any[];
                            if(records.length > 0) {
                                loadSnapshot(editor.store, parsedState);
                            }
                        } else {
                            // Direct snapshot load
                           loadSnapshot(editor.store, parsedState);
                        }
                    } catch (e) {
                         console.error("Failed to load canvas state", e);
                    }
                }
            })
            .catch(err => console.error("Initial fetch error:", err));
    }, [meetingId]);

    // Handle incoming real-time cursor/drawing data from other users
    const handleRemoteChange = useCallback((msg: any) => {
        if (!editor || !msg.payload) return;
        
        try {
            const payloadStr = new TextDecoder().decode(msg.payload);
            const changes = JSON.parse(payloadStr);

            // Merge changes seamlessly into our local Tldraw store without triggering our own 'user' listeners
            editor.store.mergeRemoteChanges(() => {
                const added = Object.values(changes.added || {});
                const updated = Object.values(changes.updated || {}).map((u: any) => u[1]); // u[0] is old, u[1] is new
                const removed = Object.keys(changes.removed || {});
                
                if (added.length > 0) editor.store.put(added as any);
                if (updated.length > 0) editor.store.put(updated as any);
                if (removed.length > 0) editor.store.remove(removed as any);
            });
        } catch (err) {
            console.error("Failed to parse incoming canvas update", err);
        }
    }, [editor]);

    useDataChannel('canvas-update', handleRemoteChange);

    // Setup listener for changes
    useEffect(() => {
        if (!editor || !meetingId || !localParticipant) return;

        const unsubscribe = editor.store.listen(
            (update) => {
                // Ignore updates that are just changing view states (like mouse movement, selection)
                // We only care if actual shapes bindings etc are modified
                if(Object.keys(update.changes.added).length === 0 &&
                   Object.keys(update.changes.updated).length === 0 &&
                   Object.keys(update.changes.removed).length === 0 ) {
                     return;
                }

                // 1. Instantly broadcast this specific stroke/change to everyone else via LiveKit!
                try {
                    const payloadBytes = new TextEncoder().encode(JSON.stringify(update.changes));
                    localParticipant.publishData(payloadBytes, { topic: 'canvas-update' }).catch((e: any) => {
                         console.error("Failed to broadcast canvas update via LiveKit (Connection might be closed)", e);
                    });
                } catch (e) {
                    console.error("Failed to encode payload via LiveKit", e);
                }

                // 2. Debounce the background save to Redis/MongoDB to prevent flooding the backend on every drag pixel
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }

                saveTimeoutRef.current = setTimeout(async () => {
                    const snapshot = getSnapshot(editor.store);
                    try {
                        await fetch('/api/brainstorming/canvas', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                meetingId,
                                state: snapshot
                            })
                        });
                    } catch (err) {
                        console.error("Failed to sync canvas to backend", err);
                    }
                }, 1000); // Wait 1 second after last edit before sending
            },
            { scope: 'document', source: 'user' }
        );

        return () => {
            unsubscribe();
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [editor, meetingId, localParticipant]);

    return (
        <div className="w-full h-full relative">
            <Tldraw onMount={handleMount} />
        </div>
    );
}