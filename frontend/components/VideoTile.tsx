'use client';

import React, { useRef, useEffect } from 'react';

interface VideoTileProps {
    stream: MediaStream | null;
    username: string;
    isMuted?: boolean;
    isLocal?: boolean;
    isScreenShare?: boolean;
}

export default function VideoTile({
    stream,
    username,
    isMuted = false,
    isLocal = false,
    isScreenShare = false,
}: VideoTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        if (stream) {
            videoEl.srcObject = stream;
            const playPromise = videoEl.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch((error) => {
                    console.warn('Autoplay prevented until user interaction:', error);
                });
            }
            return;
        }

        videoEl.srcObject = null;
    }, [stream]);

    const hasVideo = stream?.getVideoTracks().some((t) => t.enabled && t.readyState === 'live');

    return (
        <div
            className={`relative overflow-hidden rounded-2xl bg-slate-800/80 border border-slate-700/50 backdrop-blur-sm group transition-all duration-300 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 ${isScreenShare ? 'col-span-full row-span-full min-h-[240px]' : 'aspect-video min-h-[180px] sm:min-h-[220px]'
                }`}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className="w-full h-full object-cover"
            />

            {!hasVideo && !isScreenShare && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-lg shadow-indigo-500/30">
                        {username.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">
                        {isLocal ? `${username} (You)` : username}
                    </span>
                    {isScreenShare && (
                        <span className="text-xs bg-indigo-500/80 text-white px-2 py-0.5 rounded-full">
                            Screen
                        </span>
                    )}
                </div>
            </div>

            {isMuted && (
                <div className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                </div>
            )}

            {isLocal && (
                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs bg-emerald-500/80 backdrop-blur-sm text-white px-2 py-1 rounded-full">
                        You
                    </span>
                </div>
            )}
        </div>
    );
}
