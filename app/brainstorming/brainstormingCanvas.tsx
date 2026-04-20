"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useSocketSync } from "@/hooks/useSocketSync";
import throttle from "lodash/throttle";

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
    
    const { socket, isRemoteUpdate, performRemoteAction } = useSocketSync(meetingId);
    const socketRef = useRef<any>(null);

    useEffect(() => {
        socketRef.current = socket;
    }, [socket]);

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
                lastElementsRef.current = (parsedState.elements || []).map((el: any) => ({ id: el.id, version: el.version }));
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
                            // Auto-fit content in readOnly (Document Viewer) mode
                            if (readOnly) {
                                setTimeout(() => excalidrawAPI.scrollToContent(), 500);
                            }
                        } else {
                            setInitialData({ elements: parsedState.elements || [] });
                        }
                        lastElementsRef.current = (parsedState.elements || []).map((el: any) => ({ id: el.id, version: el.version }));
                    } catch (e) {
                        console.error("Failed to parse initial canvas state", e);
                    }
                }
            })
            .catch(err => console.error("Initial fetch error:", err));
    }, [meetingId, excalidrawAPI, propInitialData, readOnly]);

    // ──────────────────────────────────────────────────────────────────
    //  Debounced persistence – saves to Redis AND MongoDB
    //  Triggered by onChange (via broadcastChanges) so it reacts to
    //  every real drawing interaction instead of running only once.
    // ──────────────────────────────────────────────────────────────────
    const saveInProgress = useRef(false);
    const saveToDB = useRef(
        throttle(async (api: any, mid: string) => {
            if (saveInProgress.current) return;
            saveInProgress.current = true;
            try {
                const allElements = api.getSceneElements();
                if (!allElements || allElements.length === 0) return;

                const payloadState = { elements: allElements };

                // Save to Redis (live cache)
                await fetch('/api/brainstorming/canvas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ meetingId: mid, state: payloadState })
                });

                // Save to MongoDB (persistent)
                await fetch('/api/brainstorming/canvas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ meetingId: mid, action: 'save_to_db', state: payloadState })
                });
            } catch (err) {
                console.warn('[canvas] Save failed:', err);
            } finally {
                saveInProgress.current = false;
            }
        }, 5000, { leading: false, trailing: true }) // save at most once every 5 seconds
    ).current;

    // Throttled Broadcast Function
    const broadcastChanges = useRef(
        throttle((elements: readonly any[], meetingIdInner: string, api: any) => {
            if (!socketRef.current || isRemoteUpdate.current) return;

            // Only send changed elements based on version
            const changedElements = elements.filter((el: any) => {
                const lastEl = lastElementsRef.current.find(le => le.id === el.id);
                return !lastEl || el.version > lastEl.version;
            });

            if (changedElements.length > 0) {
                socketRef.current.emit('canvas-change', { meetingId: meetingIdInner, elements: changedElements });
                
                // Update tracker
                changedElements.forEach(el => {
                    const idx = lastElementsRef.current.findIndex(le => le.id === el.id);
                    if (idx > -1) {
                        lastElementsRef.current[idx].version = el.version;
                    } else {
                        lastElementsRef.current.push({ id: el.id, version: el.version });
                    }
                });

                // Trigger persistence on every meaningful change
                if (api) saveToDB(api, meetingIdInner);
            }
        }, 100) // 100ms throttle for smoothness vs payload balance
    ).current;

    const onChange = useCallback((elements: readonly any[], appState: any) => {
        if (readOnly) return;
        broadcastChanges(elements, meetingId, excalidrawAPI);
    }, [readOnly, broadcastChanges, meetingId, excalidrawAPI]);

    // Receive Changes
    useEffect(() => {
        if (!socket || !excalidrawAPI) return;

        socket.on('canvas-update', ({ elements, senderId }: any) => {
            if (senderId === socket.id) return;

            performRemoteAction(() => {
                const currentElements = excalidrawAPI.getSceneElements() || [];
                const mergedElements = [...currentElements];

                elements.forEach((remoteEl: any) => {
                    const index = mergedElements.findIndex(el => el.id === remoteEl.id);
                    if (index === -1) {
                        mergedElements.push(remoteEl);
                    } else if (remoteEl.version > mergedElements[index].version) {
                        mergedElements[index] = remoteEl;
                    }

                    // Update local tracker so we don't broadcast back what we just received
                    const trackerIdx = lastElementsRef.current.findIndex(le => le.id === remoteEl.id);
                    if (trackerIdx > -1) {
                        lastElementsRef.current[trackerIdx].version = Math.max(lastElementsRef.current[trackerIdx].version, remoteEl.version);
                    } else {
                        lastElementsRef.current.push({ id: remoteEl.id, version: remoteEl.version });
                    }
                });

                excalidrawAPI.updateScene({ elements: mergedElements });
            });
        });

        return () => {
            socket.off('canvas-update');
        };
    }, [socket, excalidrawAPI, performRemoteAction]);

    // Flush any pending save when component unmounts
    useEffect(() => {
        return () => {
            saveToDB.flush();
        };
    }, [saveToDB]);

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
        </div>
    );
}