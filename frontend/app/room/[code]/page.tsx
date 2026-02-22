'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSocket from '@/hooks/useSocket';
import useMediaStream from '@/hooks/useMediaStream';
import useWebRTC from '@/hooks/useWebRTC';
import VideoGrid from '@/components/VideoGrid';
import ControlBar from '@/components/ControlBar';
import ChatPanel from '@/components/ChatPanel';

interface ChatMessage {
    username: string;
    message: string;
    timestamp: string;
    socketId: string;
}

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomCode = params.code as string;

    const { socket, disconnect } = useSocket();
    const {
        localStream,
        screenStream,
        isMicOn,
        isCameraOn,
        isScreenSharing,
        startLocalStream,
        toggleMic,
        toggleCamera,
        startScreenShare,
        stopScreenShare,
        cleanup: cleanupMedia,
    } = useMediaStream();

    const [username, setUsername] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [screenShareSocketId, setScreenShareSocketId] = useState<string | null>(null);
    const [permissionError, setPermissionError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const hasJoined = useRef(false);

    const { remoteStreams, replaceTrack, cleanup: cleanupWebRTC } = useWebRTC({
        socket,
        roomCode,
        username,
        localStream,
    });

    // ── Load username and init media ──────────────────────────────────────────
    useEffect(() => {
        const savedUsername = localStorage.getItem('roommatch-username') || 'Guest';
        setUsername(savedUsername);

        const initMedia = async () => {
            try {
                await startLocalStream();
                setIsLoading(false);
            } catch {
                setPermissionError('Camera/Mic access denied. Please allow permissions and reload.');
                setIsLoading(false);
            }
        };

        initMedia();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Join room once media is ready ──────────────────────────────────────────
    useEffect(() => {
        if (localStream && socket && username && !hasJoined.current) {
            hasJoined.current = true;

            socket.emit('join-room', { code: roomCode, username });
            setIsJoined(true);
        }
    }, [localStream, socket, username, roomCode]);

    // ── Socket event listeners ────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleChatMessage = (msg: ChatMessage) => {
            setMessages((prev) => [...prev, msg]);
        };

        const handleScreenShareUpdate = ({
            socketId,
            isSharing,
        }: {
            socketId: string;
            isSharing: boolean;
        }) => {
            setScreenShareSocketId(isSharing ? socketId : null);
        };

        const handleErrorMessage = ({ message }: { message: string }) => {
            setPermissionError(message);
        };

        socket.on('chat-message', handleChatMessage);
        socket.on('screen-share-update', handleScreenShareUpdate);
        socket.on('error-message', handleErrorMessage);

        return () => {
            socket.off('chat-message', handleChatMessage);
            socket.off('screen-share-update', handleScreenShareUpdate);
            socket.off('error-message', handleErrorMessage);
        };
    }, [socket]);

    // ── Handle screen share toggle ────────────────────────────────────────────
    const handleToggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            stopScreenShare();
            // Replace the screen track with camera track in all peer connections
            if (localStream) {
                await replaceTrack(localStream, 'video');
            }
            socket.emit('screen-share-toggle', { code: roomCode, isSharing: false });
        } else {
            const stream = await startScreenShare();
            if (stream) {
                // Replace camera track with screen track in all peer connections
                await replaceTrack(stream, 'video');
                socket.emit('screen-share-toggle', { code: roomCode, isSharing: true });

                // Auto-revert when screen share ends via browser UI
                stream.getVideoTracks()[0].onended = async () => {
                    stopScreenShare();
                    if (localStream) {
                        await replaceTrack(localStream, 'video');
                    }
                    socket.emit('screen-share-toggle', { code: roomCode, isSharing: false });
                };
            }
        }
    }, [isScreenSharing, stopScreenShare, startScreenShare, localStream, replaceTrack, socket, roomCode]);

    // ── Send chat message ──────────────────────────────────────────────────────
    const sendMessage = useCallback(
        (message: string) => {
            socket.emit('chat-message', { code: roomCode, message, username });
        },
        [socket, roomCode, username]
    );

    // ── Leave meeting ──────────────────────────────────────────────────────────
    const handleLeave = useCallback(() => {
        socket.emit('leave-room', { code: roomCode });
        cleanupWebRTC();
        cleanupMedia();
        disconnect();
        router.push('/');
    }, [socket, roomCode, cleanupWebRTC, cleanupMedia, disconnect, router]);

    // ── Cleanup on unmount ────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (hasJoined.current) {
                socket?.emit('leave-room', { code: roomCode });
            }
            cleanupWebRTC();
            cleanupMedia();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Loading state ─────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-700/50" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
                    </div>
                    <p className="text-slate-300 text-lg font-medium">Setting up your meeting...</p>
                    <p className="text-slate-500 text-sm mt-1">Requesting camera & microphone access</p>
                </div>
            </div>
        );
    }

    // ── Permission error ──────────────────────────────────────────────────────
    if (permissionError && !localStream) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center max-w-md mx-4">
                    <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Permission Required</h2>
                    <p className="text-slate-400 mb-6">{permissionError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-all"
                    >
                        Reload & Try Again
                    </button>
                </div>
            </div>
        );
    }

    // ── Main meeting room ────────────────────────────────────────────────────
    return (
        <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-2 bg-slate-900/60 backdrop-blur-xl border-b border-slate-700/30 z-30">
                <div className="flex items-center gap-3">
                    <span className="text-xl">🚀</span>
                    <span className="font-bold text-white text-lg hidden sm:inline">RoomMatch</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm text-slate-300 font-mono">{roomCode}</span>
                    </div>
                    <span className="text-sm text-slate-400">{remoteStreams.length + 1} participants</span>
                </div>
            </header>

            {/* Video Grid */}
            <main className={`flex-1 min-h-0 pb-20 transition-all duration-300 ${isChatOpen ? 'mr-0 sm:mr-96' : ''}`}>
                <VideoGrid
                    localStream={localStream}
                    remoteStreams={remoteStreams}
                    username={username}
                    isMicOn={isMicOn}
                    screenShareSocketId={screenShareSocketId}
                    screenStream={screenStream}
                    isLocalScreenSharing={isScreenSharing}
                />
            </main>

            {/* Controls */}
            <ControlBar
                isMicOn={isMicOn}
                isCameraOn={isCameraOn}
                isScreenSharing={isScreenSharing}
                isChatOpen={isChatOpen}
                roomCode={roomCode}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
                onToggleScreenShare={handleToggleScreenShare}
                onToggleChat={() => setIsChatOpen((prev) => !prev)}
                onLeave={handleLeave}
            />

            {/* Chat Panel */}
            <ChatPanel
                isOpen={isChatOpen}
                messages={messages}
                onSendMessage={sendMessage}
                onClose={() => setIsChatOpen(false)}
                currentSocketId={socket.id || ''}
            />
        </div>
    );
}
