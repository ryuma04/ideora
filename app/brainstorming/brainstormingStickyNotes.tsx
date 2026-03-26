"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import ReactFlow, {
    Background, Controls, MiniMap,
    useNodesState, useEdgesState, addEdge,
    Connection, Edge, Node, BackgroundVariant,
    useReactFlow, ReactFlowProvider
} from "reactflow";
import "reactflow/dist/style.css";
import { useLocalParticipant, useDataChannel } from "@livekit/components-react";
import StickyNoteNode from "./StickyNoteNode";

const STICKY_COLORS = [
    { name: 'yellow', hex: 'bg-[#fde047]', border: 'border-[#eab308]' },
    { name: 'green', hex: 'bg-[#86efac]', border: 'border-[#4ade80]' },
    { name: 'blue', hex: 'bg-[#93c5fd]', border: 'border-[#60a5fa]' },
    { name: 'violet', hex: 'bg-[#d8b4fe]', border: 'border-[#c084fc]' },
    { name: 'red', hex: 'bg-[#fca5a5]', border: 'border-[#f87171]' }
];

interface StickyNotesProps {
    meetingId: string;
    readOnly?: boolean;
}

function StickyNotesContent({ meetingId, readOnly = false }: StickyNotesProps) {
    const nodeTypes = useMemo(() => ({
        sticky: StickyNoteNode,
    }), []);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const { fitView } = useReactFlow();

    const handleNodeChange = useCallback((id: string, newLabel: string) => {
        if (readOnly) return;
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return { ...node, data: { ...node.data, label: newLabel } };
                }
                return node;
            })
        );
    }, [setNodes, readOnly]);

    const addStickyNote = useCallback((colorObj: any) => {
        if (readOnly) return;
        const newNodeId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const randomOffsetX = (Math.random() - 0.5) * 80;
        const randomOffsetY = (Math.random() - 0.5) * 80;

        const newNode: Node = {
            id: newNodeId,
            type: 'sticky',
            position: { x: 400 + randomOffsetX, y: 300 + randomOffsetY },
            data: { 
                label: '', 
                color: colorObj.hex, 
                borderColor: colorObj.border,
                onChange: handleNodeChange 
            },
        };

        setNodes((nds) => [...nds, newNode]);
    }, [setNodes, handleNodeChange, readOnly]);

    useEffect(() => {
        fetch(`/api/brainstorming/stickyNotes?meetingId=${meetingId}`)
            .then(res => res.json())
            .then(data => {
                if (data.state && Array.isArray(data.state.nodes) && Array.isArray(data.state.edges)) {
                    const loadedNodes = data.state.nodes.map((n: Node) => ({
                        ...n,
                        data: { ...n.data, onChange: readOnly ? undefined : handleNodeChange }
                    }));
                    setNodes(loadedNodes);
                    setEdges(data.state.edges);
                }
                setIsLoaded(true);
            })
            .catch(err => {
                console.error("Initial fetch error:", err);
                setIsLoaded(true);
            });
    }, [meetingId, handleNodeChange, setNodes, setEdges, readOnly]);

    useEffect(() => {
        if (isLoaded && readOnly) {
            setTimeout(() => {
                fitView({ padding: 0.2, duration: 800 });
            }, 100);
        }
    }, [isLoaded, readOnly, fitView, nodes.length]);

    const onConnect = useCallback((params: Edge | Connection) => {
        setEdges((eds) => addEdge({...params, animated: false, style: { stroke: '#94a3b8', strokeWidth: 3, strokeDasharray: '5,5' } }, eds));
    }, [setEdges]);

    if (!isLoaded) return <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">Loading Notes...</div>;

    const getNodeColor = (node: Node) => {
        if (node.data?.color && typeof node.data.color === 'string') {
            return node.data.color.replace('bg-[', '').replace(']', '');
        }
        return '#fde047';
    };

    return (
        <div className="w-full h-full min-h-[500px] relative bg-slate-800 overflow-hidden text-slate-900">
            {!readOnly && (
                <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-4 bg-slate-800/95 backdrop-blur-xl p-4 rounded-[24px] border border-slate-700 shadow-2xl">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center leading-tight">
                        Add<br/>Note
                    </p>
                    {STICKY_COLORS.map((colorObj) => (
                        <button
                            key={colorObj.name}
                            onClick={() => addStickyNote(colorObj)}
                            className={`w-12 h-12 rounded-xl border-t-[6px] ${colorObj.hex} ${colorObj.border} shadow-lg transform transition-all duration-200 hover:scale-110 hover:-translate-y-1 opacity-90 hover:opacity-100 flex items-center justify-center group`}
                            title={`Add ${colorObj.name} note`}
                        >
                            <svg className="w-6 h-6 text-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4"/></svg>
                        </button>
                    ))}
                </div>
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={readOnly ? undefined : onNodesChange}
                onEdgesChange={readOnly ? undefined : onEdgesChange}
                onConnect={readOnly ? undefined : onConnect}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                className="bg-slate-800"
                nodesDraggable={!readOnly}
                nodesConnectable={!readOnly}
                elementsSelectable={!readOnly}
            >
                <Background variant={BackgroundVariant.Cross} gap={24} size={2} color="#475569" />
                <Controls className="bg-slate-700 border-slate-600 fill-white text-white" />
                <MiniMap 
                    nodeStrokeColor={(n) => '#94a3b8'}
                    nodeColor={getNodeColor}
                    maskColor="rgba(0, 0, 0, 0.4)"
                    className="bg-slate-700"
                />
            </ReactFlow>

             {!readOnly && (
                 <div className="absolute bottom-6 left-28 z-10 bg-slate-800/90 backdrop-blur-xl px-5 py-4 rounded-xl border border-slate-700 text-xs text-slate-300 pointer-events-none shadow-2xl">
                    <p className="font-bold text-white mb-2 flex items-center gap-2 text-sm border-b border-slate-700 pb-2">
                       <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                       Sticky Notes Wall
                    </p>
                    <div className="space-y-1.5 text-[13px]">
                        <p>• <span className="text-emerald-400 font-medium">Click a color</span> to drop a note</p>
                        <p>• <span className="text-white font-medium">Drag from edges</span> to connect strings between notes</p>
                    </div>
                </div>
             )}

            {!readOnly && (
                <StickyNotesLiveKitSync 
                    nodes={nodes} 
                    edges={edges} 
                    meetingId={meetingId} 
                    isLoaded={isLoaded}
                    onRemoteUpdate={(incoming) => {
                        const restoredNodes = incoming.nodes.map((n: any) => ({
                            ...n,
                            data: { ...n.data, onChange: handleNodeChange }
                        }));
                        setNodes(restoredNodes);
                        setEdges(incoming.edges);
                    }}
                />
            )}
        </div>
    );
}

export default function BrainstormingStickyNotes(props: StickyNotesProps) {
    return (
        <ReactFlowProvider>
            <StickyNotesContent {...props} />
        </ReactFlowProvider>
    );
}

interface SyncProps {
    nodes: Node[];
    edges: Edge[];
    meetingId: string;
    isLoaded: boolean;
    onRemoteUpdate: (state: any) => void;
}

function StickyNotesLiveKitSync({ nodes, edges, meetingId, isLoaded, onRemoteUpdate }: SyncProps) {
    const { localParticipant } = useLocalParticipant();
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isLoaded || !localParticipant) return;
        
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            const cleanNodes = nodes.map(n => ({...n, data: { ...n.data, onChange: undefined }}));
            const stateToSave = { nodes: cleanNodes, edges };
            
            try {
                const payloadStr = JSON.stringify(stateToSave);
                const payloadBytes = new TextEncoder().encode(payloadStr);
                localParticipant.publishData(payloadBytes, { topic: 'stickynotes-reactflow' }).catch(() => {});
            } catch (e) {}

            try {
                await fetch('/api/brainstorming/stickyNotes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ meetingId, state: stateToSave })
                });
            } catch (err) {}
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [nodes, edges, meetingId, localParticipant, isLoaded]);

    useDataChannel('stickynotes-reactflow', (msg) => {
        try {
            const payloadStr = new TextDecoder().decode(msg.payload);
            const incomingState = JSON.parse(payloadStr);
            if (incomingState.nodes && incomingState.edges) {
                onRemoteUpdate(incomingState);
            }
        } catch (err) {}
    });

    return null;
}
