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
    ReactFlowProvider
} from "reactflow";
import "reactflow/dist/style.css";
import { useLocalParticipant, useDataChannel } from "@livekit/components-react";
import MindmapNode from "./MindmapNode";

interface MindmapProps {
    meetingId: string;
    readOnly?: boolean;
}

const COLORS = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-violet-500', 'bg-orange-500', 'bg-rose-500', 'bg-cyan-500'
];

function MindmapContent({ meetingId, readOnly = false }: MindmapProps) {
    const nodeTypes = useMemo(() => ({
        mindmap: MindmapNode,
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

    const handleBranch = useCallback((parentId: string) => {
        if (readOnly) return;
        const newNodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

        setNodes((nds) => {
            const parent = nds.find(n => n.id === parentId);
            if (!parent) return nds;

            const newNode: Node = {
                id: newNodeId,
                type: 'mindmap',
                position: { x: parent.position.x + 280, y: parent.position.y + (Math.random() - 0.5) * 100 },
                data: { label: '', color: randomColor, onBranch: handleBranch, onChange: handleNodeChange },
            };
            return [...nds, newNode];
        });

        setEdges((eds) => {
            const edgeId = `e${parentId}-${newNodeId}`;
            if (eds.some(e => e.id === edgeId)) return eds;
            return [
                ...eds,
                { id: edgeId, source: parentId, target: newNodeId, animated: true, style: { stroke: '#fff', strokeWidth: 2 } }
            ];
        });
    }, [setNodes, setEdges, handleNodeChange, readOnly]);

    useEffect(() => {
        fetch(`/api/brainstorming/mindmapping?meetingId=${meetingId}`)
            .then(res => res.json())
            .then(data => {
                if (data.state && Array.isArray(data.state.nodes) && Array.isArray(data.state.edges)) {
                    const loadedNodes = data.state.nodes.map((n: Node) => ({
                        ...n,
                        data: { ...n.data, onBranch: readOnly ? undefined : handleBranch, onChange: readOnly ? undefined : handleNodeChange }
                    }));
                    setNodes(loadedNodes);
                    setEdges(data.state.edges);
                } else if (!readOnly) {
                    const rootNode: Node = {
                        id: 'root',
                        type: 'mindmap',
                        position: { x: 400, y: 300 },
                        data: { label: 'Core Idea', color: 'bg-pink-600', onBranch: handleBranch, onChange: handleNodeChange },
                    };
                    setNodes([rootNode]);
                }
                setIsLoaded(true);
            })
            .catch(err => {
                console.error("Initial fetch error:", err);
                setIsLoaded(true);
            });
    }, [meetingId, handleBranch, handleNodeChange, setNodes, setEdges, readOnly]);

    useEffect(() => {
        if (isLoaded && readOnly) {
            setTimeout(() => {
                fitView({ padding: 0.2, duration: 800 });
            }, 100);
        }
    }, [isLoaded, readOnly, fitView, nodes.length]);

    const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge({...params, animated: true, style: { stroke: '#fff', strokeWidth: 2 } }, eds)), [setEdges]);

    if (!isLoaded) return <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">Loading Map...</div>;

    return (
        <div className="w-full h-full min-h-[500px] relative bg-slate-900">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={readOnly ? undefined : onNodesChange}
                onEdgesChange={readOnly ? undefined : onEdgesChange}
                onConnect={readOnly ? undefined : onConnect}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                className="bg-slate-900"
                nodesDraggable={!readOnly}
                nodesConnectable={!readOnly}
                elementsSelectable={!readOnly}
            >
                <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#334155" />
                <Controls className="bg-slate-800 border-slate-700 fill-white text-white" />
                <MiniMap 
                    nodeStrokeColor={() => '#2dd4bf'}
                    nodeColor={() => '#1e293b'}
                    maskColor="rgba(0, 0, 0, 0.5)"
                    className="bg-slate-800"
                />
            </ReactFlow>

             {!readOnly && (
                 <div className="absolute bottom-4 left-4 z-10 bg-slate-800/90 backdrop-blur-md px-4 py-3 rounded-lg border border-slate-700 text-xs text-slate-300 pointer-events-none shadow-2xl">
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

            {!readOnly && (
                <MindmapLiveKitSync 
                    nodes={nodes} 
                    edges={edges} 
                    meetingId={meetingId} 
                    isLoaded={isLoaded}
                    onRemoteUpdate={(incoming) => {
                         const restoredNodes = incoming.nodes.map((n: any) => ({
                            ...n,
                            data: { ...n.data, onBranch: handleBranch, onChange: handleNodeChange }
                        }));
                        setNodes(restoredNodes);
                        setEdges(incoming.edges);
                    }}
                />
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

interface SyncProps {
    nodes: Node[];
    edges: Edge[];
    meetingId: string;
    isLoaded: boolean;
    onRemoteUpdate: (state: any) => void;
}

function MindmapLiveKitSync({ nodes, edges, meetingId, isLoaded, onRemoteUpdate }: SyncProps) {
    const { localParticipant } = useLocalParticipant();
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isLoaded || !localParticipant) return;
        
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            const cleanNodes = nodes.map(n => ({...n, data: { ...n.data, onBranch: undefined, onChange: undefined }}));
            const stateToSave = { nodes: cleanNodes, edges };
            
            try {
                const payloadStr = JSON.stringify(stateToSave);
                const payloadBytes = new TextEncoder().encode(payloadStr);
                localParticipant.publishData(payloadBytes, { topic: 'mindmap-reactflow' }).catch(() => {});
            } catch (e) {}

            try {
                await fetch('/api/brainstorming/mindmapping', {
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

    useDataChannel('mindmap-reactflow', (msg) => {
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
