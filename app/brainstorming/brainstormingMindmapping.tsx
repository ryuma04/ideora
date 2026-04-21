"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    BackgroundVariant,
    useReactFlow,
    ReactFlowProvider,
    applyNodeChanges,
    applyEdgeChanges,
    NodeChange,
    EdgeChange
} from "reactflow";
import "reactflow/dist/style.css";
import { useSocketSync } from "@/hooks/useSocketSync";
import MindmapNode from "./MindmapNode";

const COLORS = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-violet-500', 'bg-orange-500', 'bg-rose-500', 'bg-cyan-500'
];

interface MindmapProps {
    meetingId: string;
    readOnly?: boolean;
    initialData?: any;
}

function MindmapContent({ meetingId, readOnly = false, initialData }: MindmapProps) {
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

    // Refs to track latest state for save-on-unmount
    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);
    const isLoadedRef = useRef(isLoaded);
    useEffect(() => { nodesRef.current = nodes; }, [nodes]);
    useEffect(() => { edgesRef.current = edges; }, [edges]);
    useEffect(() => { isLoadedRef.current = isLoaded; }, [isLoaded]);

    const nodeTypes = useMemo(() => ({
        mindmap: MindmapNode,
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

        // Emit change for data update (like label change)
        if (socketRef.current && !isRemoteUpdate.current) {
            socketRef.current.emit('mindmap-change', {
                meetingId,
                type: 'nodes',
                changes: [{
                    id,
                    type: 'replace', // Custom type or just data update
                    item: { id, data: { ...dataUpdate, version: timestamp } }
                }]
            });
        }
    }, [setNodes, meetingId, isRemoteUpdate]);

    // Node Text Change Handler
    const handleNodeChange = useCallback((id: string, newLabel: string) => {
        if (readOnly) return;
        updateNodeWithVersion(id, { label: newLabel });
    }, [readOnly, updateNodeWithVersion]);

    // Branch Node Handler
    const handleBranch = useCallback((parentId: string) => {
        if (readOnly) return;
        
        const newNodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        const timestamp = Date.now();

        const newNode: Node = {
            id: newNodeId,
            type: 'mindmap',
            position: { x: 0, y: 0 }, // Will be set by parent relative
            data: { label: '', color: randomColor, onBranch: handleBranch, onChange: handleNodeChange, version: timestamp },
        };

        setNodes((nds) => {
            const parent = nds.find(n => n.id === parentId);
            if (!parent) return nds;
            newNode.position = { x: parent.position.x + 280, y: parent.position.y + (Math.random() - 0.5) * 100 };
            return [...nds, newNode];
        });

        setEdges((eds) => {
            const edgeId = `e${parentId}-${newNodeId}`;
            if (eds.some(e => e.id === edgeId)) return eds;
            const newEdge = { id: edgeId, source: parentId, target: newNodeId, animated: true, style: { stroke: '#fff', strokeWidth: 2 } };
            
            // Emit new node and edge
            if (socketRef.current && !isRemoteUpdate.current) {
                socketRef.current.emit('mindmap-change', {
                    meetingId,
                    type: 'nodes',
                    changes: [{ type: 'add', item: newNode }]
                });
                socketRef.current.emit('mindmap-change', {
                    meetingId,
                    type: 'edges',
                    changes: [{ type: 'add', item: newEdge }]
                });
            }
            
            return [...eds, newEdge];
        });
    }, [setNodes, setEdges, handleNodeChange, readOnly, meetingId, isRemoteUpdate]);

    // React Flow Change Handlers (Deltas)
    const onNodesChangeLocal = useCallback((changes: NodeChange[]) => {
        if (readOnly) return;

        // Apply changes locally
        setNodes((nds) => applyNodeChanges(changes, nds));

        // Broadcast changes if not from remote
        if (socketRef.current && !isRemoteUpdate.current) {
            socketRef.current.emit('mindmap-change', { meetingId, changes, type: 'nodes' });
        }
    }, [readOnly, setNodes, meetingId, isRemoteUpdate]);

    const onEdgesChangeLocal = useCallback((changes: EdgeChange[]) => {
        if (readOnly) return;

        setEdges((eds) => applyEdgeChanges(changes, eds));

        if (socket && !isRemoteUpdate.current) {
            socket.emit('mindmap-change', { meetingId, changes, type: 'edges' });
        }
    }, [readOnly, setEdges, socket, meetingId, isRemoteUpdate]);

    const onConnectLocal = useCallback((params: Edge | Connection) => {
        if (readOnly) return;
        const newEdge = { ...params, animated: true, style: { stroke: '#fff', strokeWidth: 2 } };
        setEdges((eds) => {
             const updatedEdges = addEdge(newEdge, eds);
             if (socketRef.current && !isRemoteUpdate.current) {
                socketRef.current.emit('mindmap-change', { 
                    meetingId, 
                    type: 'edges', 
                    changes: [{ type: 'add', item: updatedEdges[updatedEdges.length - 1] }] 
                });
             }
             return updatedEdges;
        });
    }, [setEdges, meetingId, isRemoteUpdate, readOnly]);

    // Socket listeners for remote updates
    useEffect(() => {
        if (!socket) return;

        socket.on('mindmap-update', ({ changes, type, senderId }) => {
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

                        // 2. Conflict Resolution: Only apply if version is newer (for data updates)
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
                            data: { ...n.data, onBranch: readOnly ? undefined : handleBranch, onChange: readOnly ? undefined : handleNodeChange }
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
            socket.off('mindmap-update');
        };
    }, [socket, performRemoteAction, setNodes, setEdges, handleBranch, handleNodeChange, readOnly]);

    // Initialization (Fetch from DB)
    useEffect(() => {
        if (initialData) {
            try {
                const parsed = typeof initialData === 'string' ? JSON.parse(initialData) : initialData;
                if (parsed.nodes && parsed.edges) {
                    const loadedNodes = parsed.nodes.map((n: Node) => {
                        if (n.data?.version) nodeVersions.current[n.id] = n.data.version;
                        return {
                            ...n,
                            data: { ...n.data, onBranch: readOnly ? undefined : handleBranch, onChange: readOnly ? undefined : handleNodeChange }
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

        fetch(`/api/brainstorming/mindmapping?meetingId=${meetingId}`)
            .then(res => res.json())
            .then(data => {
                if (data.state && Array.isArray(data.state.nodes) && Array.isArray(data.state.edges)) {
                    const loadedNodes = data.state.nodes.map((n: Node) => {
                        if (n.data?.version) nodeVersions.current[n.id] = n.data.version;
                        return {
                            ...n,
                            data: { ...n.data, onBranch: readOnly ? undefined : handleBranch, onChange: readOnly ? undefined : handleNodeChange }
                        };
                    });
                    setNodes(loadedNodes);
                    setEdges(data.state.edges);
                } else if (!readOnly) {
                    const rootNode: Node = {
                        id: 'root-node',
                        type: 'mindmap',
                        position: { x: 250, y: 300 },
                        data: { label: 'Central Idea', color: 'bg-indigo-600', onBranch: handleBranch, onChange: handleNodeChange, version: Date.now() },
                    };
                    setNodes([rootNode]);
                }
                setIsLoaded(true);
            })
            .catch(err => {
                console.error("Initial fetch error:", err);
                setIsLoaded(true);
            });
    }, [meetingId, handleBranch, handleNodeChange, setNodes, setEdges, readOnly, initialData]);

    // DB Persistence logic (Debounced)
    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (!isLoaded || readOnly) return;
            
            const cleanNodes = nodes.map(n => ({...n, data: { ...n.data, onBranch: undefined, onChange: undefined }}));
            const stateToSave = { nodes: cleanNodes, edges };

            try {
                await fetch('/api/brainstorming/mindmapping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ meetingId, state: stateToSave })
                });
                await fetch('/api/brainstorming/mindmapping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ meetingId, action: 'save_to_db', state: stateToSave })
                });
            } catch (err) {}
        }, 5000);

        return () => clearTimeout(timeout);
    }, [nodes, edges, isLoaded, readOnly, meetingId]);

    // Save immediately on unmount (prevents data loss when switching tools)
    useEffect(() => {
        return () => {
            if (!isLoadedRef.current || readOnly) return;
            const cleanNodes = nodesRef.current.map((n: any) => ({ ...n, data: { ...n.data, onBranch: undefined, onChange: undefined } }));
            const stateToSave = { nodes: cleanNodes, edges: edgesRef.current };
            fetch('/api/brainstorming/mindmapping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meetingId, state: stateToSave })
            }).catch(() => {});
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meetingId, readOnly]);

    // Auto-fit when loaded or in read-only mode periodic fit
    useEffect(() => {
        if (isLoaded && readOnly) {
            fitView({ padding: 0.2, duration: 800 });
        }
    }, [isLoaded, readOnly, fitView, nodes.length]);


    if (!isLoaded) return <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">Loading Map...</div>;

    return (
        <div className="w-full h-full relative bg-slate-900">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChangeLocal}
                onEdgesChange={onEdgesChangeLocal}
                onConnect={onConnectLocal}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                className="bg-slate-900"
                nodesDraggable={!readOnly}
                nodesConnectable={!readOnly}
                elementsSelectable={!readOnly}
            >
                <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#334155" />
                {!readOnly && <Controls className="bg-slate-800 border-slate-700 fill-white text-white" />}
                {!readOnly && (
                    <MiniMap 
                        nodeStrokeColor={() => '#2dd4bf'}
                        nodeColor={() => '#1e293b'}
                        maskColor="rgba(0, 0, 0, 0.5)"
                        className="bg-slate-800"
                    />
                )}
            </ReactFlow>

             {/* Mindmap specific instructions on bottom left */}
             {!readOnly && (
                 <div className="absolute bottom-4 left-4 z-10 bg-slate-800/90 backdrop-blur-md px-4 py-3 rounded-lg border border-slate-700 text-xs text-slate-300 pointer-events-none shadow-2xl hidden md:block">
                <p className="font-bold text-slate-200 mb-1 flex items-center gap-1 text-sm border-b border-slate-700 pb-1">
                   <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   Map Controls
                </p>
                <div className="mt-2 space-y-1">
                    <p>1. <span className="text-white font-medium">Click +</span> to sprout a new branched idea</p>
                    <p>2. <span className="text-white font-medium">Type</span> instantly into the text area</p>
                    <p>3. <span className="text-white font-medium">Drag nodes</span> around to organize</p>
                    <p>4. <span className="text-white font-medium">Drag from edges</span> to visually link things</p>
                </div>
            </div>
             )}
        </div>
    );
}

export default function BrainstormingMindmapping(props: MindmapProps) {
    return (
        <ReactFlowProvider>
            <MindmapContent {...props} />
        </ReactFlowProvider>
    );
}
