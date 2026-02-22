'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';

export function useSocket() {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = getSocket();
        socketRef.current = socket;

        if (!socket.connected) {
            socket.connect();
        }

        return () => {
            // Don't disconnect on unmount — we manage lifecycle elsewhere
        };
    }, []);

    const disconnect = useCallback(() => {
        if (socketRef.current?.connected) {
            socketRef.current.disconnect();
        }
    }, []);

    return { socket: socketRef.current ?? getSocket(), disconnect };
}

export default useSocket;
