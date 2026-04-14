"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useLocalParticipant, useDataChannel } from "@livekit/components-react";

// Excalidraw is client-side only
const Excalidraw = dynamic(
    async () => (await import("@excalidraw/excalidraw")).Excalidraw,
    { ssr: false }
);

interface CanvasProps {
    meetingId: string;
    readOnly?: boolean;
    initialData?: any;
}

export default function BrainstormingCanvas({ meetingId, readOnly = false, initialData: propInitialData }: CanvasProps) {
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const [initialData, setInitialData] = useState<any>({ elements: [] });
    const lastElementsRef = useRef<any[]>([]);

    // Fetch initial state
    useEffect(() => {
        if (propInitialData) {
            try {
                const parsedState = typeof propInitialData === 'string' ? JSON.parse(propInitialData) : propInitialData;
                if (excalidrawAPI) {
                    excalidrawAPI.updateScene({ elements: parsedState.elements || [] });
                } else {
                    setInitialData({ elements: parsedState.elements || [] });
                }
                lastElementsRef.current = parsedState.elements || [];
            } catch (e) {
                console.error("Failed to parse initial canvas state", e);
            }
            return;
        }

        if (!meetingId) return;
        fetch(`/api/brainstorming/canvas?meetingId=${meetingId}`)
            .then(res => res.json())
            .then(data => {
                if (data.state) {
                    try {
                        const parsedState = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
                        // For Excalidraw, we might need to set scene instead of initialData if excalidrawAPI is ready
                        if (excalidrawAPI) {
                            excalidrawAPI.updateScene({ elements: parsedState.elements || [] });
                        } else {
                            setInitialData({ elements: parsedState.elements || [] });
                        }
                        lastElementsRef.current = parsedState.elements || [];
                    } catch (e) {
                        console.error("Failed to parse initial canvas state", e);
                    }
                }
            })
            .catch(err => console.error("Initial fetch error:", err));
    }, [meetingId, excalidrawAPI, propInitialData]);

    const onChange = useCallback((elements: readonly any[], appState: any) => {
        if (readOnly) return;

        // Removed updating `lastElementsRef` here. The `setInterval` in `CanvasLiveKitSync`
        // will now be able to accurately diff the elements.
    }, [readOnly]);

    return (
        <div className="w-full h-full relative">
            <Excalidraw
                excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
                initialData={initialData}
                onChange={onChange}
                theme="dark"
                viewModeEnabled={readOnly}
                UIOptions={{
                    welcomeScreen: false,
                    canvasActions: {
                        toggleTheme: false,
                        loadScene: false,
                        export: false,
                        saveAsImage: false,
                    }
                }}
            />

            {!readOnly && (
                <CanvasLiveKitSync
                    excalidrawAPI={excalidrawAPI}
                    meetingId={meetingId}
                    lastElementsRef={lastElementsRef}
                />
            )}
        </div>
    );
}

interface SyncProps {
    excalidrawAPI: any;
    meetingId: string;
    lastElementsRef: React.MutableRefObject<any[]>;
}

function CanvasLiveKitSync({ excalidrawAPI, meetingId, lastElementsRef }: SyncProps) {
    const { localParticipant } = useLocalParticipant();
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Broadcast Changes
    useEffect(() => {
        const interval = setInterval(() => {
            if (!excalidrawAPI || !localParticipant || !meetingId) return;

            const elements = excalidrawAPI.getSceneElements();
            if (!elements) return;

            // Simple diffing using versions
            const changedElements = elements.filter((el: any) => {
                const lastEl = lastElementsRef.current.find(le => le.id === el.id);
                return !lastEl || el.version > lastEl.version; // Check if version is bumped
            });

            if (changedElements.length > 0) {
                // Publish to LiveKit
                try {
                    const payloadBytes = new TextEncoder().encode(JSON.stringify(changedElements));
                    localParticipant.publishData(payloadBytes, { topic: 'canvas-update' }).catch(() => { });
                } catch (e) { }

                // Sync to DB (debounced)
                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = setTimeout(async () => {
                    try {
                        const allElements = excalidrawAPI.getSceneElements();
                        const payloadState = { elements: allElements, appState: excalidrawAPI.getAppState() };

                        // Save to Redis (Live cache)
                        await fetch('/api/brainstorming/canvas', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ meetingId, state: payloadState })
                        });

                        // Save to DB (Persistent storage for documents)
                        await fetch('/api/brainstorming/canvas', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                meetingId,
                                action: 'save_to_db',
                                state: payloadState
                            })
                        });
                    } catch (err) { }
                }, 1500);

                lastElementsRef.current = [...elements];
            }
        }, 1000); // Check for local changes every second

        return () => {
            clearInterval(interval);
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [excalidrawAPI, localParticipant, meetingId]);

    // Receive Changes
    useDataChannel('canvas-update', (msg) => {
        if (!excalidrawAPI || !msg.payload) return;
        try {
            const payloadStr = new TextDecoder().decode(msg.payload);
            const remoteElements = JSON.parse(payloadStr);

            const currentElements = excalidrawAPI.getSceneElements() || [];
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
        } catch (err) { }
    });

    return null;
}