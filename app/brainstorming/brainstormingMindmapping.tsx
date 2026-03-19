"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useLocalParticipant, useDataChannel } from "@livekit/components-react";

// Excalidraw is client-side only
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

interface MindmapProps {
    meetingId: string;
}

export default function BrainstormingMindmapping({ meetingId }: MindmapProps) {
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { localParticipant } = useLocalParticipant();
    const [initialData, setInitialData] = useState<any>(null);
    const lastElementsRef = useRef<any[]>([]);
    const initializedRef = useRef(false);

    // Build the default root elements using convertToExcalidrawElements
    const buildRootElements = useCallback(async (rootX: number, rootY: number) => {
        const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
        return convertToExcalidrawElements([
            {
                type: "rectangle",
                id: "root-node",
                x: rootX,
                y: rootY,
                width: 200,
                height: 60,
                backgroundColor: "#4c6ef5",
                strokeColor: "#4c6ef5",
                fillStyle: "solid",
                roundness: { type: 3 },
                strokeWidth: 2,
                label: {
                    text: "Main Idea",
                    fontSize: 24,
                    strokeColor: "#ffffff",
                },
            },
        ]);
    }, []);

    // Fetch initial state or create default root
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        fetch(`/api/brainstorming/mindmapping?meetingId=${meetingId}`)
            .then(res => res.json())
            .then(async (data) => {
                if (data.state) {
                    try {
                        const parsedState = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
                        setInitialData(parsedState);
                        lastElementsRef.current = parsedState.elements || [];
                    } catch (e) {
                         console.error("Failed to parse mindmap state", e);
                    }
                } else {
                    const rootX = (window.innerWidth / 2) - 100;
                    const rootY = (window.innerHeight / 2) - 30;
                    const elements = await buildRootElements(rootX, rootY);
                    setInitialData({ elements });
                    lastElementsRef.current = elements;
                }
            })
            .catch(async (err) => {
                console.error("Initial fetch error:", err);
                const elements = await buildRootElements(500, 300);
                setInitialData({ elements });
                lastElementsRef.current = elements;
            });
    }, [meetingId, buildRootElements]);

    // Handle incoming real-time data
    const handleRemoteChange = useCallback((msg: any) => {
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
        } catch (err) {
            console.error("Failed to parse incoming mindmap update", err);
        }
    }, [excalidrawAPI]);

    useDataChannel('mindmap-update', handleRemoteChange);

    const onChange = useCallback((elements: readonly any[], appState: any) => {
        if (!localParticipant || !meetingId) return;

        // Preserve arrow colors
        const preservedElements = elements.map((el: any) => {
            if (el.type === "arrow" && !el.strokeColor) {
                return { ...el, strokeColor: "#ffffff" };  // ← Ensure white
            }
            return el;
        });

        const changedElements = preservedElements.filter(el => {
            const lastRootEl = lastElementsRef.current.find(le => le.id === el.id);
            return !lastRootEl || lastRootEl.version < el.version;
        });

        if (changedElements.length > 0) {
            try {
                const payloadBytes = new TextEncoder().encode(JSON.stringify(changedElements));
                localParticipant.publishData(payloadBytes, { topic: 'mindmap-update' }).catch((e: any) => {
                     console.error("Failed to broadcast mindmap update via LiveKit", e);
                });
            } catch (e) {
                console.error("Failed to encode mindmap update", e);
            }

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(async () => {
                try {
                    await fetch('/api/brainstorming/mindmapping', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            meetingId,
                            state: { elements: preservedElements, appState }
                        })
                    });
                } catch (err) {
                    console.error("Failed to sync mindmap to backend", err);
                }
            }, 1000);
        }
        lastElementsRef.current = [...preservedElements];
    }, [localParticipant, meetingId]);

    const handleAddChild = async () => {
        if (!excalidrawAPI) return;
        
        const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");

        const sceneElements = excalidrawAPI.getSceneElements() || [];
        const appState = excalidrawAPI.getAppState();

        // Find the selected rectangle node (skip text elements)
        const selectedRects = sceneElements.filter((el: any) => 
            appState.selectedElementIds[el.id] && el.type === "rectangle"
        );

        // If user selected a text element, find its parent rectangle
        let parent: any = null;
        if (selectedRects.length === 1) {
            parent = selectedRects[0];
        } else {
            const selectedAll = sceneElements.filter((el: any) => appState.selectedElementIds[el.id]);
            if (selectedAll.length === 1 && selectedAll[0].type === "text" && selectedAll[0].containerId) {
                parent = sceneElements.find((el: any) => el.id === selectedAll[0].containerId);
            }
        }

        if (!parent) {
            alert("Please select exactly one node to branch off from.");
            return;
        }

        const currentElements = [...sceneElements];
        
        const now = Date.now();
        const childId = `node-${now}`;
        const arrowId = `arrow-${now}`;
        
        const childX = parent.x + parent.width + 120;
        const childY = parent.y + (Math.random() - 0.5) * 120;

        const colors = ['#ff922b', '#74c0fc', '#63e6be', '#94d82d', '#ffd43b', '#ff8787', '#e599f7'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        // Use convertToExcalidrawElements for proper element initialization
        const newElements = convertToExcalidrawElements([
            {
                type: "rectangle",
                id: childId,
                x: childX,
                y: childY,
                width: 160,
                height: 50,
                backgroundColor: randomColor,
                strokeColor: randomColor,
                fillStyle: "solid",
                roundness: { type: 3 },
                strokeWidth: 2,
                label: {
                    text: "New Idea",
                    fontSize: 18,
                    strokeColor: "#ffffff",
                },
            },
            {
                type: "arrow",
                id: arrowId,
                x: parent.x + parent.width,
                y: parent.y + parent.height / 2,
                width: childX - (parent.x + parent.width),
                height: (childY + 25) - (parent.y + parent.height / 2),
                strokeColor: "#ffffff",  // ← WHITE ARROWS
                strokeWidth: 2,
                roundness: { type: 2 },
                start: { id: parent.id },
                end: { id: childId },
                endArrowhead: "arrow",
            },
        ]);

        // Update parent's boundElements to include the new arrow
        const parentIndex = currentElements.findIndex((el: any) => el.id === parent.id);
        if (parentIndex !== -1) {
            const existingBound = currentElements[parentIndex].boundElements || [];
            const alreadyHasArrow = existingBound.some((b: any) => b.id === arrowId);
            if (!alreadyHasArrow) {
                currentElements[parentIndex] = {
                    ...currentElements[parentIndex],
                    boundElements: [...existingBound, { type: "arrow", id: arrowId }],
                    version: (currentElements[parentIndex].version || 1) + 1,
                    versionNonce: Math.floor(Math.random() * 1000000),
                };
            }
        }

        excalidrawAPI.updateScene({ 
            elements: [...currentElements, ...newElements],
            appState: { selectedElementIds: { [childId]: true } }
        });
    };

    const handleRecenter = () => {
        if (!excalidrawAPI) return;
        excalidrawAPI.scrollToContent();
    };

    // Don't render Excalidraw until initialData is ready
    if (!initialData) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
                <div className="text-slate-400 text-sm">Loading mind map...</div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-slate-800 overflow-hidden">
            
            {/* Custom Control Overlay */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <button
                    onClick={handleAddChild}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg shadow-xl font-bold transition-all hover:scale-105 border border-pink-500/50"
                    title="Select a node and click this to add a branched idea"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Branch
                </button>
            </div>

            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                    onClick={handleRecenter}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg shadow-xl transition-colors text-sm font-medium"
                    title="Center View"
                >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" /></svg>
                    Focus Map
                </button>
            </div>
            
            {/* Mindmap specific instructions on bottom left */}
            <div className="absolute bottom-4 left-4 z-10 bg-slate-800/90 backdrop-blur-md px-4 py-3 rounded-lg border border-slate-700 text-xs text-slate-300 pointer-events-none shadow-2xl">
                <p className="font-bold text-slate-200 mb-1 flex items-center gap-1 text-sm border-b border-slate-700 pb-1">
                   <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   Mapping Tutorial
                </p>
                <div className="mt-2 space-y-1">
                    <p>1. <span className="text-white font-medium">Click</span> any shape to highlight it</p>
                    <p>2. Click <span className="text-pink-400 font-medium">New Branch</span> to sprout an idea</p>
                    <p>3. <span className="text-white font-medium">Double-click</span> inside a shape to type</p>
                    <p>4. <span className="text-white font-medium">Drag</span> the background to pan</p>
                </div>
            </div>

            {/* Canvas Engine */}
            <div className="absolute inset-0 z-0 hide-excalidraw-ui">
                <style jsx global>{`
                    .hide-excalidraw-ui .excalidraw .App-toolbar-container,
                    .hide-excalidraw-ui .excalidraw .layer-ui__wrapper .Island:not(.App-toolbar),
                    .hide-excalidraw-ui .excalidraw .App-menu,
                    .hide-excalidraw-ui .excalidraw .welcome-screen {
                        display: none !important;
                    }
                `}</style>
                <Excalidraw
                    excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
                    initialData={initialData}
                    onChange={onChange}
                    theme="dark"
                    UIOptions={{
                        canvasActions: { loadScene: false, export: false, saveAsImage: false, clearCanvas: false },
                        welcomeScreen: false
                    }}
                />
            </div>
        </div>
    );
}