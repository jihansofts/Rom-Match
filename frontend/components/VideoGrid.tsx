'use client';

import React from 'react';
import VideoTile from './VideoTile';

interface StreamInfo {
    socketId: string;
    username: string;
    stream: MediaStream;
}

interface VideoGridProps {
    localStream: MediaStream | null;
    remoteStreams: StreamInfo[];
    username: string;
    isMicOn: boolean;
    screenShareSocketId: string | null;
    screenStream: MediaStream | null;
    isLocalScreenSharing: boolean;
}

export default function VideoGrid({
    localStream,
    remoteStreams,
    username,
    isMicOn,
    screenShareSocketId,
    screenStream,
    isLocalScreenSharing,
}: VideoGridProps) {
    const totalParticipants = 1 + remoteStreams.length; // local + remote
    const isAnyoneScreenSharing = !!screenShareSocketId || isLocalScreenSharing;

    // ── Determine grid layout ───────────────────────────────────────────────────
    const getGridClass = () => {
        if (isAnyoneScreenSharing) {
            return 'grid-cols-1 lg:grid-cols-[1fr_280px]';
        }
        if (totalParticipants === 1) return 'grid-cols-1';
        if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2';
        if (totalParticipants <= 4) return 'grid-cols-2';
        return 'grid-cols-2 lg:grid-cols-3';
    };

    // ── Screen share layout ────────────────────────────────────────────────────
    if (isAnyoneScreenSharing) {
        const screenShareStream = isLocalScreenSharing
            ? screenStream
            : remoteStreams.find((s) => s.socketId === screenShareSocketId)?.stream;
        const screenShareUser = isLocalScreenSharing
            ? username
            : remoteStreams.find((s) => s.socketId === screenShareSocketId)?.username || 'Unknown';

        return (
            <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 p-3">
                {/* Main screen share view */}
                <div className="min-h-0">
                    <VideoTile
                        stream={screenShareStream || null}
                        username={screenShareUser}
                        isScreenShare
                    />
                </div>

                {/* Sidebar with participant videos */}
                <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden">
                    <div className="flex-shrink-0 w-48 lg:w-full aspect-video">
                        <VideoTile
                            stream={localStream}
                            username={username}
                            isMuted={!isMicOn}
                            isLocal
                        />
                    </div>
                    {remoteStreams.map((remote) => (
                        <div key={remote.socketId} className="flex-shrink-0 w-48 lg:w-full aspect-video">
                            <VideoTile
                                stream={remote.stream}
                                username={remote.username}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ── Regular grid layout ────────────────────────────────────────────────────
    return (
        <div className={`w-full h-full grid ${getGridClass()} gap-3 p-3 auto-rows-fr`}>
            <VideoTile
                stream={localStream}
                username={username}
                isMuted={!isMicOn}
                isLocal
            />
            {remoteStreams.map((remote) => (
                <VideoTile
                    key={remote.socketId}
                    stream={remote.stream}
                    username={remote.username}
                />
            ))}
        </div>
    );
}
