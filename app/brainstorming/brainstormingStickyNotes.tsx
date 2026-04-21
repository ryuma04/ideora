"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import ReactFlow, {
    Background, Controls, MiniMap,
    useNodesState, useEdgesState, addEdge,
    Connection, Edge, Node, BackgroundVariant,
    useReactFlow, ReactFlowProvider,
    applyNodeChanges, applyEdgeChanges,
    NodeChange, EdgeChange
} from "reactflow";
import "reactflow/dist/style.css";
import { useSocketSync } from "@/hooks/useSocketSync";
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
    initialData?: any;
}

function StickyNotesContent({ meetingId, readOnly = false, initialData }: StickyNotesProps) {
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const { fitView } = useReactFlow();
    const { socket, isRemoteUpdate, performRemoteAction } = useSocketSync(meetingId);
    const socketRef = useRef<any>(null);

    useEffect(() => {
        socketRef.current = socket;
    }, [socket]);

    // Track versions for LWW (Last Writer Wins)
    const nodeVersions = useRef<Record<string, number>>({});

    const nodeTypes = useMemo(() => ({
        sticky: StickyNoteNode,
    }), []);

    // Helper to update node data with versioning
    const updateNodeWithVersion = useCallback((id: string, dataUpdate: any) => {
        const timestamp = Date.now();
        nodeVersions.current[id] = timestamp;
        
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return { ...node, data: { ...node.data, ...dataUpdate, version: timestamp } };
                }
                return node;
            })
        );

        if (socketRef.current && !isRemoteUpdate.current) {
            socketRef.current.emit('sticky-notes-change', { 
                meetingId,
                type: 'nodes',
                changes: [{
                    id,
                    type: 'replace',
                    item: { id, data: { ...dataUpdate, version: timestamp } }
                }]
            });
        }
    }, [setNodes, meetingId, isRemoteUpdate]);

    const handleNodeChange = useCallback((id: string, newLabel: string) => {
        if (readOnly) return;
        updateNodeWithVersion(id, { label: newLabel });
    }, [readOnly, updateNodeWithVersion]);

    const addStickyNote = useCallback((colorObj: any) => {
        if (readOnly) return;
        const newNodeId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = Date.now();
        
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
                onChange: handleNodeChange,
                version: timestamp
            },
        };

        setNodes((nds) => [...nds, newNode]);
        nodeVersions.current[newNodeId] = timestamp;

        if (socketRef.current && !isRemoteUpdate.current) {
            socketRef.current.emit('sticky-notes-change', { meetingId, type: 'nodes', changes: [{ type: 'add', item: newNode }] });
        }
    }, [setNodes, handleNodeChange, readOnly, meetingId, isRemoteUpdate]);

    // React Flow Change Handlers
    const onNodesChangeLocal = useCallback((changes: NodeChange[]) => {
        if (readOnly) return;
        setNodes((nds) => applyNodeChanges(changes, nds));
        if (socketRef.current && !isRemoteUpdate.current) {
            socketRef.current.emit('sticky-notes-change', { meetingId, changes, type: 'nodes' });
        }
    }, [readOnly, setNodes, meetingId, isRemoteUpdate]);

    const onEdgesChangeLocal = useCallback((changes: EdgeChange[]) => {
        if (readOnly) return;
        setEdges((eds) => applyEdgeChanges(changes, eds));
        if (socketRef.current && !isRemoteUpdate.current) {
            socketRef.current.emit('sticky-notes-change', { meetingId, changes, type: 'edges' });
        }
    }, [readOnly, setEdges, meetingId, isRemoteUpdate]);

    const onConnectLocal = useCallback((params: Edge | Connection) => {
        if (readOnly) return;
        const newEdge = { ...params, animated: false, style: { stroke: '#94a3b8', strokeWidth: 3, strokeDasharray: '5,5' } };
        setEdges((eds) => {
             const updatedEdges = addEdge(newEdge, eds);
             if (socketRef.current && !isRemoteUpdate.current) {
                socketRef.current.emit('sticky-notes-change', { 
                    meetingId, 
                    type: 'edges', 
                    changes: [{ type: 'add', item: updatedEdges[updatedEdges.length - 1] }] 
                });
             }
             return updatedEdges;
        });
    }, [setEdges, meetingId, isRemoteUpdate, readOnly]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('sticky-notes-update', ({ changes, type, senderId }) => {
            if (senderId === socket.id) return;

            performRemoteAction(() => {
                if (type === 'nodes') {
                    setNodes((nds) => {
                        // 1. Filter out 'add' changes for nodes that already exist
                        const uniqueChanges = changes.filter((change: any) => {
                            if (change.type === 'add' && nds.some(n => n.id === change.item.id)) {
                                return false;
                            }
                            return true;
                        });

                        // 2. Conflict Resolution: Only apply if version is newer
                        const filteredChanges = uniqueChanges.filter((change: any) => {
                            if (change.type === 'replace' || (change.item && change.item.data && change.item.data.version)) {
                                const id = change.id || change.item.id;
                                const incomingVersion = change.item?.data?.version || 0;
                                const localVersion = nodeVersions.current[id] || 0;
                                if (incomingVersion <= localVersion && localVersion !== 0) return false;
                                if (incomingVersion > 0) nodeVersions.current[id] = incomingVersion;
                            }
                            return true;
                        });

                        const updated = applyNodeChanges(filteredChanges, nds);
                        
                        // 3. Manually apply 'replace' (data/text) changes since applyNodeChanges ignores them
                        let finalNodes = updated;
                        filteredChanges.forEach((change: any) => {
                            if (change.type === 'replace' && change.item) {
                                finalNodes = finalNodes.map(n => {
                                    if (n.id === change.item.id) {
                                        return { ...n, data: { ...n.data, ...change.item.data } };
                                    }
                                    return n;
                                });
                            }
                        });

                        return finalNodes.map(n => ({
                            ...n,
                            data: { ...n.data, onChange: readOnly ? undefined : handleNodeChange }
                        }));
                    });
                } else if (type === 'edges') {
                    setEdges((eds) => {
                        // Filter out 'add' changes for edges that already exist
                        const uniqueChanges = changes.filter((change: any) => {
                            if (change.type === 'add' && eds.some(e => e.id === change.item.id)) {
                                return false;
                            }
                            return true;
                        });
                        return applyEdgeChanges(uniqueChanges, eds);
                    });
                }
            });
        });

        return () => {
            socket.off('sticky-notes-update');
        };
    }, [socket, performRemoteAction, setNodes, setEdges, handleNodeChange, readOnly]);

    // Initialization
    useEffect(() => {
        if (initialData) {
            try {
                const parsed = typeof initialData === 'string' ? JSON.parse(initialData) : initialData;
                if (parsed.nodes && parsed.edges) {
                    const loadedNodes = parsed.nodes.map((n: Node) => {
                        if (n.data?.version) nodeVersions.current[n.id] = n.data.version;
                        return {
                            ...n,
                            data: { ...n.data, onChange: readOnly ? undefined : handleNodeChange }
                        };
                    });
                    setNodes(loadedNodes);
                    setEdges(parsed.edges);
                }
            } catch (e) {
                console.error("Failed to parse initialData", e);
            }
            setIsLoaded(true);
            return;
        }

        fetch(`/api/brainstorming/stickyNotes?meetingId=${meetingId}`)
            .then(res => res.json())
            .then(data => {
                if (data.state && Array.isArray(data.state.nodes) && Array.isArray(data.state.edges)) {
                    const loadedNodes = data.state.nodes.map((n: Node) => {
                        if (n.data?.version) nodeVersions.current[n.id] = n.data.version;
                        return {
                            ...n,
                            data: { ...n.data, onChange: readOnly ? undefined : handleNodeChange }
                        };
                    });
                    setNodes(loadedNodes);
                    setEdges(data.state.edges);
                }
                setIsLoaded(true);
            })
            .catch(err => {
                console.error("Initial fetch error:", err);
                setIsLoaded(true);
            });
    }, [meetingId, handleNodeChange, setNodes, setEdges, readOnly, initialData]);

    // DB Persistence logic
    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (!isLoaded || readOnly) return;
            
            const cleanNodes = nodes.map(n => ({...n, data: { ...n.data, onChange: undefined }}));
            const stateToSave = { nodes: cleanNodes, edges };

            try {
                await fetch('/api/brainstorming/stickyNotes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ meetingId, state: stateToSave })
                });
                await fetch('/api/brainstorming/stickyNotes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ meetingId, action: 'save_to_db', state: stateToSave })
                });
            } catch (err) {}
        }, 5000);

        return () => clearTimeout(timeout);
    }, [nodes, edges, isLoaded, readOnly, meetingId]);

    // Auto-fit
    useEffect(() => {
        if (isLoaded && readOnly) {
            fitView({ padding: 0.2, duration: 800 });
        }
    }, [isLoaded, readOnly, fitView, nodes.length]);

    if (!isLoaded) return <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">Loading Notes...</div>;

    const getNodeColor = (node: Node) => {
        if (node.data?.color && typeof node.data.color === 'string') {
            return node.data.color.replace('bg-[', '').replace(']', '');
        }
        return '#fde047';
    };

    return (
        <div className="w-full h-full relative bg-slate-800 overflow-hidden text-slate-900">
            {/* Custom Control Palette Overlay */}
            {!readOnly && (
                <div className="sticky-notes-palette absolute left-6 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-4 bg-slate-800/95 backdrop-blur-xl p-4 rounded-[24px] border border-slate-700 shadow-2xl">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center leading-tight hidden sm:block">
                        Add<br/>Note
                    </p>
                    {STICKY_COLORS.map((colorObj) => (
                        <button
                            key={colorObj.name}
                            onClick={() => addStickyNote(colorObj)}
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border-t-[4px] sm:border-t-[6px] ${colorObj.hex} ${colorObj.border} shadow-lg transform transition-all duration-200 hover:scale-110 hover:-translate-y-1 opacity-90 hover:opacity-100 flex items-center justify-center group`}
                            title={`Add ${colorObj.name} note`}
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4"/></svg>
                        </button>
                    ))}
                </div>
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChangeLocal}
                onEdgesChange={onEdgesChangeLocal}
                onConnect={onConnectLocal}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                className="bg-slate-800"
                nodesDraggable={!readOnly}
                nodesConnectable={!readOnly}
                elementsSelectable={!readOnly}
            >
                <Background variant={BackgroundVariant.Cross} gap={24} size={2} color="#475569" />
                {!readOnly && <Controls className="bg-slate-700 border-slate-600 fill-white text-white" />}
                {!readOnly && (
                    <MiniMap 
                        nodeStrokeColor={(n) => '#94a3b8'}
                        nodeColor={getNodeColor}
                        maskColor="rgba(0, 0, 0, 0.4)"
                        className="bg-slate-700"
                    />
                )}
            </ReactFlow>

             {/* Instructions Overlay */}
             {!readOnly && (
                 <div className="sticky-notes-instructions absolute bottom-6 left-28 z-10 bg-slate-800/90 backdrop-blur-xl px-5 py-4 rounded-xl border border-slate-700 text-xs text-slate-300 pointer-events-none shadow-2xl hidden md:block">
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

