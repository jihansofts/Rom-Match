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
    const totalParticipants = 1 + remoteStreams.length;
    const isAnyoneScreenSharing = !!screenShareSocketId || isLocalScreenSharing;

    const getGridClass = () => {
        if (isAnyoneScreenSharing) {
            return 'grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]';
        }
        if (totalParticipants === 1) return 'grid-cols-1';
        if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2';
        if (totalParticipants <= 4) return 'grid-cols-1 sm:grid-cols-2';
        return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';
    };

    if (isAnyoneScreenSharing) {
        const screenShareStream = isLocalScreenSharing
            ? screenStream
            : remoteStreams.find((s) => s.socketId === screenShareSocketId)?.stream;
        const screenShareUser = isLocalScreenSharing
            ? username
            : remoteStreams.find((s) => s.socketId === screenShareSocketId)?.username || 'Unknown';

        return (
            <div className="w-full h-full grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-3 p-3">
                <div className="min-h-0">
                    <VideoTile
                        stream={screenShareStream || null}
                        username={screenShareUser}
                        isScreenShare
                    />
                </div>

                <div className="flex xl:flex-col gap-3 overflow-x-auto xl:overflow-y-auto xl:overflow-x-hidden pb-1">
                    <div className="flex-shrink-0 w-40 sm:w-48 xl:w-full">
                        <VideoTile
                            stream={localStream}
                            username={username}
                            isMuted={!isMicOn}
                            isLocal
                        />
                    </div>
                    {remoteStreams.map((remote) => (
                        <div key={remote.socketId} className="flex-shrink-0 w-40 sm:w-48 xl:w-full">
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

    return (
        <div className={`w-full h-full grid ${getGridClass()} gap-3 p-3 auto-rows-[minmax(180px,1fr)] sm:auto-rows-[minmax(220px,1fr)]`}>
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
