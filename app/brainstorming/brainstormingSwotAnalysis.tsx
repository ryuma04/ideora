"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSocketSync } from "@/hooks/useSocketSync";

type SWOTQuadrant = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';

interface SWOTState {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
}

interface SWOTProps {
    meetingId: string;
    readOnly?: boolean;
    initialData?: SWOTState;
}

export default function BrainstormingSwotAnalysis({ meetingId, readOnly = false, initialData: propInitialData }: SWOTProps) {
    const [swotData, setSwotData] = useState<SWOTState>(propInitialData || {
        strengths: ["Great team", "Strong tech stack"],
        weaknesses: [],
        opportunities: [],
        threats: [],
    });
    const [isLoaded, setIsLoaded] = useState(false);
    const { socket, isRemoteUpdate, performRemoteAction } = useSocketSync(meetingId);

    const [inputs, setInputs] = useState({
        strengths: '',
        weaknesses: '',
        opportunities: '',
        threats: ''
    });

    // Initial DB Fetch
    useEffect(() => {
        if (propInitialData) {
            try {
                const parsed = typeof propInitialData === 'string' ? JSON.parse(propInitialData) : propInitialData;
                setSwotData(parsed);
            } catch (e) {
                console.error("Failed to parse SWOT Data:", e);
            }
            setIsLoaded(true);
            return;
        }

        if (!meetingId) return;
        fetch(`/api/brainstorming/swotAnalysis?meetingId=${meetingId}`)
            .then(res => res.json())
            .then(data => {
                if (data.state && Object.keys(data.state).length > 0) {
                    setSwotData(typeof data.state === 'string' ? JSON.parse(data.state) : data.state);
                }
                setIsLoaded(true);
            })
            .catch(err => {
                console.error("Initial fetch error:", err);
                setIsLoaded(true);
            });
    }, [meetingId, propInitialData]);

    const handleAddPoint = (quadrant: SWOTQuadrant, e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        const value = inputs[quadrant].trim();
        if (!value) return;

        const newState = {
            ...swotData,
            [quadrant]: [...swotData[quadrant], value]
        };
        
        setSwotData(newState);
        setInputs(prev => ({ ...prev, [quadrant]: '' }));

        if (socket && !isRemoteUpdate.current) {
            socket.emit('swot-change', { meetingId, state: newState });
            
            // Immediate save to Redis to ensure persistence even if meeting ends soon
            fetch('/api/brainstorming/swotAnalysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meetingId, state: newState })
            }).catch(() => {});
        }
    };

    const handleRemovePoint = (quadrant: SWOTQuadrant, index: number) => {
        if (readOnly) return;
        const newState = {
            ...swotData,
            [quadrant]: swotData[quadrant].filter((_, i) => i !== index)
        };
        setSwotData(newState);

        if (socket && !isRemoteUpdate.current) {
            socket.emit('swot-change', { meetingId, state: newState });
            
            // Immediate save to Redis
            fetch('/api/brainstorming/swotAnalysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meetingId, state: newState })
            }).catch(() => {});
        }
    };

    // Receive update
    useEffect(() => {
        if (!socket) return;
        socket.on('swot-update', ({ state, senderId }) => {
            if (senderId === socket.id) return;
            performRemoteAction(() => {
                // Merge states instead of full overwrite to be safer
                setSwotData(prev => {
                    // Simple merge strategy: combine unique items from both states
                    // This is better than full overwrite in a chaotic multi-user setting
                    const merged = { ...prev };
                    Object.keys(state).forEach((key) => {
                        const q = key as SWOTQuadrant;
                        const remoteItems = state[q] || [];
                        const localItems = prev[q] || [];
                        // Union of both arrays (removing obvious duplicates)
                        merged[q] = [...new Set([...localItems, ...remoteItems])];
                    });
                    return merged;
                });
            });
        });
        return () => { socket.off('swot-update'); };
    }, [socket, performRemoteAction]);

    // DB Persistence
    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (!isLoaded || readOnly || !meetingId) return;
            try {
                await fetch('/api/brainstorming/swotAnalysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ meetingId, state: swotData })
                });
                await fetch('/api/brainstorming/swotAnalysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ meetingId, action: 'save_to_db', state: swotData })
                });
            } catch (err) {}
        }, 5000);
        return () => clearTimeout(timeout);
    }, [swotData, meetingId, isLoaded, readOnly]);

    const quadrantConfig: Record<SWOTQuadrant, { title: string, color: string, lightColor: string, bulletColor: string }> = {
        strengths: { title: "Strengths", color: "text-emerald-400", lightColor: "bg-emerald-500/10 border-emerald-500/20", bulletColor: "bg-emerald-500" },
        weaknesses: { title: "Weaknesses", color: "text-yellow-400", lightColor: "bg-yellow-500/10 border-yellow-500/20", bulletColor: "bg-yellow-500" },
        opportunities: { title: "Opportunities", color: "text-indigo-400", lightColor: "bg-indigo-500/10 border-indigo-500/20", bulletColor: "bg-indigo-500" },
        threats: { title: "Threats", color: "text-rose-400", lightColor: "bg-rose-500/10 border-rose-500/20", bulletColor: "bg-rose-500" }
    };

    return (
        <div className="w-full h-full p-4 flex flex-col bg-slate-800 rounded-xl overflow-hidden shadow-inner">
            <div className="mb-4 px-2 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        SWOT Analysis
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Identify core strengths, weaknesses, opportunities, and threats.</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 min-h-0">
                {(Object.keys(quadrantConfig) as SWOTQuadrant[]).map(quadrant => {
                    const config = quadrantConfig[quadrant];
                    return (
                        <div key={quadrant} className={`flex flex-col rounded-xl border border-slate-700 bg-slate-900/50 overflow-hidden shadow-sm`}>
                            {/* Header */}
                            <div className={`px-4 py-3 border-b border-slate-700/50 flex items-center justify-between ${config.lightColor}`}>
                                <h3 className={`font-bold tracking-wide uppercase text-sm ${config.color}`}>
                                    {config.title}
                                </h3>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.lightColor} ${config.color}`}>
                                    {swotData[quadrant].length}
                                </span>
                            </div>

                            {/* Content List */}
                            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                                {swotData[quadrant].length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
                                        No {config.title.toLowerCase()} added yet...
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {swotData[quadrant].map((point, idx) => (
                                            <li key={idx} className="group flex items-start gap-2 text-sm text-slate-300">
                                                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${config.bulletColor}`} />
                                                <span className="flex-1 leading-relaxed">{point}</span>
                                                {!readOnly && (
                                                    <button
                                                        onClick={() => handleRemovePoint(quadrant, idx)}
                                                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity p-1"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Input Area */}
                            {!readOnly && (
                                <form onSubmit={(e) => handleAddPoint(quadrant, e)} className="p-2 border-t border-slate-700/50 bg-slate-800/50">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputs[quadrant]}
                                            onChange={(e) => setInputs(prev => ({ ...prev, [quadrant]: e.target.value }))}
                                            placeholder={`Add a point...`}
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inputs[quadrant].trim()}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.lightColor} ${config.color} hover:opacity-80`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
