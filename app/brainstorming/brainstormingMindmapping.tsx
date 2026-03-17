"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Tldraw, Editor, createShapeId, getSnapshot, loadSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { useLocalParticipant, useDataChannel } from "@livekit/components-react";

interface MindmapProps {
    meetingId: string;
}

export default function BrainstormingMindmapping({ meetingId }: MindmapProps) {
    const [editor, setEditor] = useState<Editor | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { localParticipant } = useLocalParticipant();

    const handleMount = useCallback((editor: Editor) => {
        setEditor(editor);
        
        // Force the internal canvas theme to be dark mode
        editor.user.updateUserPreferences({ colorScheme: 'dark' });

        // Wait for the next tick for the canvas size to settle
        requestAnimationFrame(() => {
            // Fetch initial state
            fetch(`/api/brainstorming/mindmapping?meetingId=${meetingId}`)
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
                            editor.zoomToFit();
                        } catch (e) {
                             console.error("Failed to load mindmap state", e);
                        }
                    } else {
                        // If the canvas is completely blank (no state), spawn a root mindmap node
                        const shapes = editor.getCurrentPageShapes();
                        if (shapes.length === 0) {
                            const rootId = createShapeId("root");
                            editor.createShape({
                                id: rootId,
                                type: 'geo',
                                x: 100,
                                y: 100,
                                props: {
                                    geo: 'rectangle',
                                    w: 240,
                                    h: 80,
                                    fill: 'solid',
                                    color: 'blue',
                                    font: 'sans',
                                    size: 'm',
                                    align: 'middle'
                                } as any
                            });
                            
                            // Programmatically focus the camera onto the new core node
                            editor.selectAll();
                            editor.zoomToSelection({ animation: { duration: 0 } });
                            editor.selectNone();

                            // Instantly put the user into typing mode on the new root node!
                            setTimeout(() => {
                                try { editor.setEditingShape(rootId); } catch(e) {}
                            }, 50);
                        }
                    }
                })
                .catch(err => console.error("Initial fetch error:", err));
        });
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
            console.error("Failed to parse incoming mindmap update", err);
        }
    }, [editor]);

    useDataChannel('mindmap-update', handleRemoteChange);

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

                // 1. Instantly broadcast this specific stroke/change to everyone else via LiveKit!
                try {
                    const payloadBytes = new TextEncoder().encode(JSON.stringify(update.changes));
                    localParticipant.publishData(payloadBytes, { topic: 'mindmap-update' }).catch((e: any) => {
                         console.error("Failed to broadcast mindmap update via LiveKit (Connection might be closed)", e);
                    });
                } catch (e) {
                    console.error("Failed to encode payload via LiveKit", e);
                }

                // 2. Debounce the background save to Redis/MongoDB
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }

                saveTimeoutRef.current = setTimeout(async () => {
                    const snapshot = getSnapshot(editor.store);
                    try {
                        await fetch('/api/brainstorming/mindmapping', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                meetingId,
                                state: snapshot
                            })
                        });
                    } catch (err) {
                        console.error("Failed to sync mindmap to backend", err);
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

    const handleAddChild = () => {
        if (!editor) return;
        
        const selectedShapeIds = editor.getSelectedShapeIds();
        if (selectedShapeIds.length !== 1) {
            alert("Please select exactly one parent node to branch off from.");
            return;
        }

        const parentId = selectedShapeIds[0];
        const parentShape = editor.getShape(parentId);
        
        if (!parentShape) return;

        // Calculate simple offset for the new node to spawn to the right
        const childId = createShapeId();
        const arrowId = createShapeId();

        const parentW = (parentShape.props as any).w || 200;
        const newX = parentShape.x + parentW + 120; // 120px to the right
        const newY = parentShape.y + ((Math.random() - 0.5) * 150); // slight random vertical offset so they don't exactly stack

        // Define colors randomly for children nodes to make the map look lively
        const colors = ['light-blue', 'green', 'light-green', 'yellow', 'orange', 'red'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        editor.createShapes([
            {
                id: childId,
                type: 'geo',
                x: newX,
                y: newY,
                props: {
                    geo: 'rectangle',
                    w: 200,
                    h: 60,
                    fill: 'solid',
                    color: randomColor,
                    font: 'sans',
                    size: 's',
                    align: 'middle'
                } as any
            },
            {
                id: arrowId,
                type: 'arrow',
                props: {
                    start: { x: 0, y: 0 },
                    end: { x: 0, y: 0 },
                    color: 'white',
                    fill: 'none' // Simple clean lines
                } as any
            }
        ]);

        // In tldraw V2, bindings are created separately from the shape properties
        editor.createBinding({
            type: 'arrow',
            fromId: arrowId,
            toId: parentId,
            props: {
                terminal: 'start',
                normalizedAnchor: { x: 0.5, y: 0.5 },
                isExact: false,
                isPrecise: true,
            }
        });

        editor.createBinding({
            type: 'arrow',
            fromId: arrowId,
            toId: childId,
            props: {
                terminal: 'end',
                normalizedAnchor: { x: 0.5, y: 0.5 },
                isExact: false,
                isPrecise: true,
            }
        });

        // Select the new child heavily so the user can see it sprouted
        editor.select(childId);
        
        // Push them straight into editing mode so they don't have to double click
        setTimeout(() => {
            try { editor.setEditingShape(childId); } catch(e) {}
        }, 50);
    };

    const handleRecenter = () => {
        if (!editor) return;
        if (editor.getCurrentPageShapes().length > 0) {
            editor.selectAll();
            editor.zoomToSelection({ animation: { duration: 300 } });
            editor.selectNone();
        }
    };

    return (
        <div className="w-full h-full relative bg-slate-800 overflow-hidden">
            
            {/* Custom Control Overlay built specifically for Mind Mapping */}
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

            {/* We use tldraw, but completely strip all its regular UI components out so it just acts as an engine */}
            <div className="absolute inset-0 z-0">
                <Tldraw hideUi onMount={handleMount} />
            </div>
        </div>
    );
}
