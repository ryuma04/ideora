import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export function useSocketSync(meetingId: string) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const isRemoteUpdate = useRef(false);

    useEffect(() => {
        if (!meetingId) return;

        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket'], // Prefer websockets for speed
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            newSocket.emit('join-meeting', meetingId);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [meetingId]);

    const performRemoteAction = (action: () => void) => {
        isRemoteUpdate.current = true;
        try {
            action();
        } finally {
            // Use a small timeout to ensure the state update has been processed 
            // and the resulting useEffect/event fire is caught
            setTimeout(() => {
                isRemoteUpdate.current = false;
            }, 50);
        }
    };

    return {
        socket,
        isRemoteUpdate,
        performRemoteAction
    };
}
