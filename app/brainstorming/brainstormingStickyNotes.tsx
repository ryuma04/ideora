"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Tldraw, Editor, createShapeId, getSnapshot, loadSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { useLocalParticipant, useDataChannel } from "@livekit/components-react";

interface StickyNotesProps {
    meetingId: string;
}

export default function BrainstormingStickyNotes({ meetingId }: StickyNotesProps) {
    const [editor, setEditor] = useState<Editor | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { localParticipant } = useLocalParticipant();

    const handleMount = useCallback((editor: Editor) => {
        setEditor(editor);
        
        // Match the application's overall dark theme for the canvas background
        editor.user.updateUserPreferences({ colorScheme: 'dark' });

        // Fetch initial state
        fetch(`/api/brainstorming/stickyNotes?meetingId=${meetingId}`)
            .then(res => res.json())
            .then(data => {
                if (data.state) {
                    try {
                        const parsedState = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
                        if (parsedState.store) {    
                            const records = Object.values(parsedState.store) as any[];
                            if(records.length > 0) {
                                loadSnapshot(editor.store, parsedState);
                            }
                        } else {
                           loadSnapshot(editor.store, parsedState);
                        }
                    } catch (e) {
                         console.error("Failed to load sticky notes state", e);
                    }
                }
                // Center on existing shapes if there are any
                requestAnimationFrame(() => {
                    const shapes = editor.getCurrentPageShapes();
                    if (shapes.length > 0) {
                        editor.zoomToFit();
                    }
                });
            })
            .catch(err => console.error("Initial fetch error:", err));
    }, [meetingId]);

    // Handle incoming real-time cursor/drawing data from other users
    const handleRemoteChange = useCallback((msg: any) => {
        if (!editor || !msg.payload) return;
        
        try {
            const payloadStr = new TextDecoder().decode(msg.payload);
            const changes = JSON.parse(payloadStr);

            editor.store.mergeRemoteChanges(() => {
                const added = Object.values(changes.added || {});
                const updated = Object.values(changes.updated || {}).map((u: any) => u[1]); // u[0] is old, u[1] is new
                const removed = Object.keys(changes.removed || {});
                
                if (added.length > 0) editor.store.put(added as any);
                if (updated.length > 0) editor.store.put(updated as any);
                if (removed.length > 0) editor.store.remove(removed as any);
            });
        } catch (err) {
            console.error("Failed to parse incoming sticky notes update", err);
        }
    }, [editor]);

    useDataChannel('sticky-notes-update', handleRemoteChange);

    // Setup listener for changes
    useEffect(() => {
        if (!editor || !meetingId || !localParticipant) return;

        const unsubscribe = editor.store.listen(
            (update) => {
                if(Object.keys(update.changes.added).length === 0 &&
                   Object.keys(update.changes.updated).length === 0 &&
                   Object.keys(update.changes.removed).length === 0 ) {
                     return;
                }

                try {
                    const payloadBytes = new TextEncoder().encode(JSON.stringify(update.changes));
                    localParticipant.publishData(payloadBytes, { topic: 'sticky-notes-update' }).catch((e: any) => {
                         console.error("Failed to broadcast sticky notes update via LiveKit (Connection might be closed)", e);
                    });
                } catch (e) {
                    console.error("Failed to encode sticky notes update", e);
                }

                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }

                saveTimeoutRef.current = setTimeout(async () => {
                    const snapshot = getSnapshot(editor.store);
                    try {
                        await fetch('/api/brainstorming/stickyNotes', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                meetingId,
                                state: snapshot
                            })
                        });
                    } catch (err) {
                        console.error("Failed to sync sticky notes to backend", err);
                    }
                }, 1000);
            },
            { scope: 'document', source: 'user' }
        );

        return () => {
            unsubscribe();
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [editor, meetingId, localParticipant]);

    const addStickyNote = (color: string) => {
        if (!editor) return;

        const noteId = createShapeId();
        
        // Calculate the center of the current viewport to spawn the note
        const viewportCenter = editor.getViewportPageBounds().center;
        
        // Add a slight random offset so multiple clicks don't stack perfectly hiding each other
        const randomOffsetX = (Math.random() - 0.5) * 50;
        const randomOffsetY = (Math.random() - 0.5) * 50;

        editor.createShape({
            id: noteId,
            type: 'note',
            x: viewportCenter.x + randomOffsetX - 100, // Offset by half the width of a standard note approx
            y: viewportCenter.y + randomOffsetY - 100,
            props: {
                color: color as any, // 'yellow', 'blue', 'green', 'light-violet', etc.
                size: 'm',
            },
        });

        // Select the newly created note and jump into editing mode
        editor.select(noteId);
        setTimeout(() => {
            try { editor.setEditingShape(noteId); } catch(e) {}
        }, 50);
    };

    const handleRecenter = () => {
        if (!editor) return;
        editor.zoomToFit({ animation: { duration: 300 } });
    };

    // Beautiful curated colors corresponding to tldraw's native palette colors
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
                
                {/* Tools */}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 mt-1 text-center leading-tight">
                    Tools
                </p>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => editor?.setCurrentTool('select')}
                        className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors border border-slate-500/30 hover:border-slate-500/50 shadow-sm"
                        title="Select Tool"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>
                    </button>
                    
                    <button
                        onClick={() => editor?.setCurrentTool('arrow')}
                        className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors border border-slate-500/30 hover:border-slate-500/50 shadow-sm"
                        title="Draw Arrow"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
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
                    <p>• <span className="text-white font-medium">Draw arrows</span> from edges to connect</p>
                </div>
            </div>

            {/* Canvas Engine */}
            <div className="absolute inset-0 z-0">
                <Tldraw hideUi onMount={handleMount} />
            </div>
        </div>
    );
}
