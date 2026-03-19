"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useLocalParticipant, useDataChannel } from "@livekit/components-react";

// Excalidraw is client-side only
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

interface StickyNotesProps {
    meetingId: string;
}

export default function BrainstormingStickyNotes({ meetingId }: StickyNotesProps) {
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { localParticipant } = useLocalParticipant();
    const [initialData, setInitialData] = useState<any>({ elements: [] });
    const lastElementsRef = useRef<any[]>([]);

    // Fetch initial state
    useEffect(() => {
        fetch(`/api/brainstorming/stickyNotes?meetingId=${meetingId}`)
            .then(res => res.json())
            .then(data => {
                if (data.state) {
                    try {
                        const parsedState = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
                        setInitialData(parsedState);
                        lastElementsRef.current = parsedState.elements || [];
                    } catch (e) {
                         console.error("Failed to parse sticky notes state", e);
                    }
                }
            })
            .catch(err => console.error("Initial fetch error:", err));
    }, [meetingId]);

    // Handle incoming real-time cursor/drawing data from other users
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
                // Note: removed elements are trickier in Excalidraw (isDeleted property)
            });

            excalidrawAPI.updateScene({ elements: mergedElements });
            lastElementsRef.current = mergedElements;
        } catch (err) {
            console.error("Failed to parse incoming sticky notes update", err);
        }
    }, [excalidrawAPI]);

    useDataChannel('sticky-notes-update', handleRemoteChange);

    const onChange = useCallback((elements: readonly any[], appState: any) => {
        if (!localParticipant || !meetingId) return;

        const changedElements = elements.filter(el => {
            const lastRootEl = lastElementsRef.current.find(le => le.id === el.id);
            return !lastRootEl || lastRootEl.version < el.version;
        });

        if (changedElements.length > 0) {
            try {
                const payloadBytes = new TextEncoder().encode(JSON.stringify(changedElements));
                localParticipant.publishData(payloadBytes, { topic: 'sticky-notes-update' }).catch((e: any) => {
                     console.error("Failed to broadcast sticky notes update via LiveKit", e);
                });
            } catch (e) {
                console.error("Failed to encode sticky notes update", e);
            }

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(async () => {
                try {
                    await fetch('/api/brainstorming/stickyNotes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            meetingId,
                            state: { elements, appState }
                        })
                    });
                } catch (err) {
                    console.error("Failed to sync sticky notes to backend", err);
                }
            }, 1000);
        }
        lastElementsRef.current = [...elements];
    }, [localParticipant, meetingId]);

    const addStickyNote = (color: string) => {
        if (!excalidrawAPI) return;

        // Map tldraw colors to Excalidraw hex codes
        const colorMap: Record<string, string> = {
            'yellow': '#ffc034',
            'green': '#40c057',
            'light-blue': '#4dabf7',
            'light-violet': '#e599f7',
            'light-red': '#ff8787'
        };

        const hexColor = colorMap[color] || '#ffc034';
        
        // Excalidraw doesn't have a simple "createShape" like tldraw, 
        // we have to manually construct a basic element or use common utilities if available.
        // For simplicity, we'll use updateScene with a new element.
        const currentElements = excalidrawAPI.getSceneElements() || [];
        const appState = excalidrawAPI.getAppState() || {};
        
        // Spawn near center
        const x = appState.scrollX + (window.innerWidth / 2) - 100;
        const y = appState.scrollY + (window.innerHeight / 2) - 100;
        
        const newNote: any = {
            type: "rectangle",
            version: 1,
            versionNonce: Math.floor(Math.random() * 1000000000),
            isDeleted: false,
            id: `note-${Date.now()}`,
            x,
            y,
            width: 200,
            height: 200,
            strokeColor: "#000000",
            backgroundColor: hexColor,
            fillStyle: "solid",
            strokeWidth: 1,
            strokeStyle: "solid",
            roundness: { type: 3 },
            seed: Math.floor(Math.random() * 1000000000),
            opacity: 100,
            groupIds: [],
            boundElements: [],
            link: null,
            locked: false,
        };

        excalidrawAPI.updateScene({ elements: [...currentElements, newNote] });
    };

    const handleRecenter = () => {
        if (!excalidrawAPI) return;
        excalidrawAPI.scrollToContent();
    };

    const colors = [
        { name: 'yellow', hex: 'bg-[#ffc034]', border: 'border-[#ffae00]' },
        { name: 'green', hex: 'bg-[#40c057]', border: 'border-[#37a44b]' },
        { name: 'light-blue', hex: 'bg-[#4dabf7]', border: 'border-[#2793ec]' },
        { name: 'light-violet', hex: 'bg-[#e599f7]', border: 'border-[#dc71f4]' },
        { name: 'light-red', hex: 'bg-[#ff8787]', border: 'border-[#ff6666]' }
    ];

    return (
        <div className="w-full h-full relative bg-slate-800 overflow-hidden">
            
            {/* Custom Control Palette Overlay */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-3 bg-slate-800/95 backdrop-blur-xl p-3 rounded-2xl border border-slate-700 shadow-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 mt-1 text-center leading-tight">
                    Tools
                </p>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => excalidrawAPI?.updateScene({ appState: { activeTool: { type: "selection" } } })}
                        className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors border border-slate-500/30 hover:border-slate-500/50 shadow-sm"
                        title="Select Tool"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>
                    </button>
                    
                    <button
                        onClick={() => excalidrawAPI?.updateScene({ appState: { activeTool: { type: "arrow" } } })}
                        className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors border border-slate-500/30 hover:border-slate-500/50 shadow-sm"
                        title="Draw Arrow"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    </button>
                    
                    <button
                        onClick={() => excalidrawAPI?.updateScene({ appState: { activeTool: { type: "freedraw" } } })}
                        className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors border border-slate-500/30 hover:border-slate-500/50 shadow-sm"
                        title="Free Draw"
                    >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                </div>

                <div className="w-full h-px bg-slate-600/50 my-1"></div>

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center leading-tight">
                    New<br/>Note
                </p>
                {colors.map((colorObj) => (
                    <button
                        key={colorObj.name}
                        onClick={() => addStickyNote(colorObj.name)}
                        className={`w-10 h-10 rounded-xl ${colorObj.hex} shadow-lg transform transition-all duration-200 hover:scale-110 hover:-translate-y-1 border-2 ${colorObj.border} opacity-90 hover:opacity-100 flex items-center justify-center group`}
                        title={`Add ${colorObj.name} sticky note`}
                    >
                        <svg className="w-5 h-5 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4"/></svg>
                    </button>
                ))}
            </div>

            {/* Focus Map Button */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                    onClick={handleRecenter}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 backdrop-blur-md hover:bg-slate-700 text-white border border-slate-700 rounded-lg shadow-xl transition-colors text-sm font-medium"
                    title="Center View"
                >
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" /></svg>
                    Focus View
                </button>
            </div>
            
            {/* Instructions Overlay */}
            <div className="absolute bottom-4 left-4 z-10 bg-slate-800/90 backdrop-blur-xl px-4 py-3 rounded-xl border border-slate-700 text-xs text-slate-300 pointer-events-none shadow-2xl ml-16">
                <p className="font-bold text-white mb-2 flex items-center gap-1.5 text-sm border-b border-slate-700 pb-1.5">
                   <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                   Sticky Notes Wall
                </p>
                <div className="space-y-1">
                    <p>• <span className="text-emerald-400 font-medium">Click a color</span> to drop a note</p>
                    <p>• <span className="text-white font-medium">Drag</span> the background to pan</p>
                    <p>• <span className="text-white font-medium">Draw arrows</span> to connect ideas</p>
                </div>
            </div>

            {/* Canvas Engine */}
            <div className="absolute inset-0 z-0 hide-excalidraw-ui">
                <style jsx global>{`
                    .hide-excalidraw-ui .excalidraw .App-toolbar-container,
                    .hide-excalidraw-ui .excalidraw .layer-ui__wrapper .Island:not(.App-toolbar),
                    .hide-excalidraw-ui .excalidraw .App-menu {
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
