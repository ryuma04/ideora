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

    // Helper to create a rectangle node with bound text inside it
    const createNodeElements = (
        nodeId: string,
        textId: string,
        x: number,
        y: number,
        width: number,
        height: number,
        bgColor: string,
        label: string,
        fontSize: number,
        extraBoundElements: { type: string; id: string }[] = []
    ) => {
        const rect: any = {
            type: "rectangle",
            id: nodeId,
            x,
            y,
            width,
            height,
            strokeColor: bgColor,
            backgroundColor: bgColor,
            fillStyle: "solid",
            roundness: { type: 3 },
            version: 1,
            versionNonce: Math.floor(Math.random() * 1000000),
            groupIds: [],
            boundElements: [
                { type: "text", id: textId },
                ...extraBoundElements
            ],
            locked: false,
            link: null,
            opacity: 100,
            strokeWidth: 2,
            strokeStyle: "solid",
            seed: Math.floor(Math.random() * 1000000),
            isDeleted: false,
        };
        const text: any = {
            type: "text",
            id: textId,
            x: x + width / 2,
            y: y + height / 2,
            width: 0,
            height: 0,
            text: label,
            fontSize,
            fontFamily: 1,
            textAlign: "center",
            verticalAlign: "middle",
            strokeColor: "#ffffff",
            backgroundColor: "transparent",
            containerId: nodeId,
            version: 1,
            versionNonce: Math.floor(Math.random() * 1000000),
            groupIds: [],
            boundElements: [],
            locked: false,
            link: null,
            opacity: 100,
            seed: Math.floor(Math.random() * 1000000),
            isDeleted: false,
            autoResize: true,
        };
        return { rect, text };
    };

    const [initialData, setInitialData] = useState<any>(() => {
        const rootX = 500;
        const rootY = 300;
        const { rect, text } = createNodeElements(
            "root-node", "root-text",
            rootX, rootY, 200, 60,
            "#4c6ef5", "Main Idea", 24
        );
        return { elements: [rect, text] };
    });
    const lastElementsRef = useRef<any[]>([]);

    // Fetch initial state
    useEffect(() => {
        fetch(`/api/brainstorming/mindmapping?meetingId=${meetingId}`)
            .then(res => res.json())
            .then(data => {
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
                    const { rect, text } = createNodeElements(
                        "root-node", "root-text",
                        rootX, rootY, 200, 60,
                        "#4c6ef5", "Main Idea", 24
                    );
                    setInitialData({ elements: [rect, text] });
                    lastElementsRef.current = [rect, text];
                }
            })
            .catch(err => console.error("Initial fetch error:", err));
    }, [meetingId]);

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

        const changedElements = elements.filter(el => {
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
                            state: { elements, appState }
                        })
                    });
                } catch (err) {
                    console.error("Failed to sync mindmap to backend", err);
                }
            }, 1000);
        }
        lastElementsRef.current = [...elements];
    }, [localParticipant, meetingId]);

    const handleAddChild = () => {
        if (!excalidrawAPI) return;
        
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
        const textId = `text-${now}`;
        const arrowId = `arrow-${now}`;
        
        const childX = parent.x + parent.width + 120;
        const childY = parent.y + (Math.random() - 0.5) * 120;

        const colors = ['#ff922b', '#74c0fc', '#63e6be', '#94d82d', '#ffd43b', '#ff8787', '#e599f7'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        // Create child node with bound text and arrow binding
        const { rect: childNode, text: textNode } = createNodeElements(
            childId, textId,
            childX, childY, 160, 50,
            randomColor, "New Idea", 18,
            [{ type: "arrow", id: arrowId }]
        );

        // Create arrow connecting parent to child
        const arrowStartX = parent.x + parent.width;
        const arrowStartY = parent.y + parent.height / 2;
        const arrowEndX = childX;
        const arrowEndY = childY + 25;

        const arrow: any = {
            type: "arrow",
            id: arrowId,
            x: arrowStartX,
            y: arrowStartY,
            width: arrowEndX - arrowStartX,
            height: arrowEndY - arrowStartY,
            strokeColor: "#adb5bd",
            strokeWidth: 2,
            strokeStyle: "solid",
            fillStyle: "solid",
            points: [[0, 0], [arrowEndX - arrowStartX, arrowEndY - arrowStartY]],
            startBinding: { elementId: parent.id, focus: 0, gap: 5 },
            endBinding: { elementId: childId, focus: 0, gap: 5 },
            endArrowhead: "arrow",
            startArrowhead: null,
            version: 1,
            versionNonce: Math.floor(Math.random() * 1000000),
            groupIds: [],
            boundElements: [],
            locked: false,
            link: null,
            opacity: 100,
            seed: Math.floor(Math.random() * 1000000),
            isDeleted: false,
            roundness: { type: 2 },
        };

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
            elements: [...currentElements, childNode, textNode, arrow],
            appState: { selectedElementIds: { [childId]: true } }
        });
    };

    const handleRecenter = () => {
        if (!excalidrawAPI) return;
        excalidrawAPI.scrollToContent();
    };

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
