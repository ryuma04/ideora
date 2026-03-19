"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLocalParticipant, useDataChannel } from "@livekit/components-react";

// Excalidraw is client-side only
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

interface CanvasProps {
    meetingId: string;
}

export default function BrainstormingCanvas({ meetingId }: CanvasProps) {
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { localParticipant } = useLocalParticipant();
    const [initialData, setInitialData] = useState<any>({ elements: [] });
    const lastElementsRef = useRef<any[]>([]);

    // Fetch initial state
    useEffect(() => {
        fetch(`/api/brainstorming/canvas?meetingId=${meetingId}`)
            .then(res => res.json())
            .then(data => {
                if (data.state) {
                    try {
                        const parsedState = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
                        setInitialData(parsedState);
                        lastElementsRef.current = parsedState.elements || [];
                    } catch (e) {
                         console.error("Failed to parse initial canvas state", e);
                    }
                }
            })
            .catch(err => console.error("Initial fetch error:", err));
    }, [meetingId]);

    // Handle incoming real-time data from other users
    const handleRemoteChange = useCallback((msg: any) => {
        if (!excalidrawAPI || !msg.payload) return;
        
        try {
            const payloadStr = new TextDecoder().decode(msg.payload);
            const remoteElements = JSON.parse(payloadStr);

            // Merge remote elements with local ones
            const currentElements = excalidrawAPI.getSceneElements();
            const mergedElements = [...currentElements];

            remoteElements.forEach((remoteEl: any) => {
                const index = mergedElements.findIndex(el => el.id === remoteEl.id);
                if (index === -1) {
                    mergedElements.push(remoteEl);
                } else if (remoteEl.version > mergedElements[index].version) {
                    mergedElements[index] = remoteEl;
                }
            });

            excalidrawAPI.updateScene({ elements: mergedElements });
            lastElementsRef.current = mergedElements;
        } catch (err) {
            console.error("Failed to parse incoming canvas update", err);
        }
    }, [excalidrawAPI]);

    useDataChannel('canvas-update', handleRemoteChange);

    const onChange = useCallback((elements: readonly any[], appState: any) => {
        if (!localParticipant || !meetingId) return;

        // Check if elements actually changed (ignoring versions for now to simplify, or use version comparison)
        const changedElements = elements.filter(el => {
            const lastRootEl = lastElementsRef.current.find(le => le.id === el.id);
            return !lastRootEl || lastRootEl.version < el.version;
        });

        if (changedElements.length > 0) {
            // 1. Broadcast changes to LiveKit
            try {
                const payloadBytes = new TextEncoder().encode(JSON.stringify(changedElements));
                localParticipant.publishData(payloadBytes, { topic: 'canvas-update' }).catch((e: any) => {
                     console.error("Failed to broadcast canvas update via LiveKit", e);
                });
            } catch (e) {
                console.error("Failed to encode payload via LiveKit", e);
            }

            // 2. Debounce background save to Redis/MongoDB
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(async () => {
                try {
                    await fetch('/api/brainstorming/canvas', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            meetingId,
                            state: { elements, appState }
                        })
                    });
                } catch (err) {
                    console.error("Failed to sync canvas to backend", err);
                }
            }, 1500);
        }
        
        lastElementsRef.current = [...elements];
    }, [localParticipant, meetingId]);

    return (
        <div className="w-full h-full relative">
            <Excalidraw
                excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
                initialData={initialData}
                onChange={onChange}
                theme="dark"
                UIOptions={{
                    welcomeScreen: false
                }}
            />
        </div>
    );
}