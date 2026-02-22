'use client';

import React from 'react';

interface ControlBarProps {
    isMicOn: boolean;
    isCameraOn: boolean;
    isScreenSharing: boolean;
    isChatOpen: boolean;
    roomCode: string;
    onToggleMic: () => void;
    onToggleCamera: () => void;
    onToggleScreenShare: () => void;
    onToggleChat: () => void;
    onLeave: () => void;
}

export default function ControlBar({
    isMicOn,
    isCameraOn,
    isScreenSharing,
    isChatOpen,
    roomCode,
    onToggleMic,
    onToggleCamera,
    onToggleScreenShare,
    onToggleChat,
    onLeave,
}: ControlBarProps) {
    const [copied, setCopied] = React.useState(false);

    const copyRoomCode = async () => {
        try {
            await navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
            const textArea = document.createElement('textarea');
            textArea.value = roomCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="flex items-center justify-center gap-3 p-4 bg-slate-900/90 backdrop-blur-xl border-t border-slate-700/50">
                {/* Mic Toggle */}
                <button
                    onClick={onToggleMic}
                    className={`relative p-3.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${isMicOn
                            ? 'bg-slate-700/80 hover:bg-slate-600/80 text-white'
                            : 'bg-red-500/90 hover:bg-red-400/90 text-white shadow-lg shadow-red-500/30'
                        }`}
                    title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
                >
                    {isMicOn ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                    )}
                </button>

                {/* Camera Toggle */}
                <button
                    onClick={onToggleCamera}
                    className={`relative p-3.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${isCameraOn
                            ? 'bg-slate-700/80 hover:bg-slate-600/80 text-white'
                            : 'bg-red-500/90 hover:bg-red-400/90 text-white shadow-lg shadow-red-500/30'
                        }`}
                    title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                    {isCameraOn ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    )}
                </button>

                {/* Screen Share */}
                <button
                    onClick={onToggleScreenShare}
                    className={`relative p-3.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${isScreenSharing
                            ? 'bg-indigo-500/90 hover:bg-indigo-400/90 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-slate-700/80 hover:bg-slate-600/80 text-white'
                        }`}
                    title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </button>

                {/* Chat Toggle */}
                <button
                    onClick={onToggleChat}
                    className={`relative p-3.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${isChatOpen
                            ? 'bg-indigo-500/90 hover:bg-indigo-400/90 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-slate-700/80 hover:bg-slate-600/80 text-white'
                        }`}
                    title="Chat"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </button>

                {/* Copy Room Code */}
                <button
                    onClick={copyRoomCode}
                    className="relative p-3.5 rounded-full bg-slate-700/80 hover:bg-slate-600/80 text-white transition-all duration-200 hover:scale-105 active:scale-95"
                    title="Copy Room Code"
                >
                    {copied ? (
                        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                    {copied && (
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-xs bg-emerald-500 text-white px-2 py-1 rounded-lg whitespace-nowrap animate-fade-in">
                            Copied!
                        </span>
                    )}
                </button>

                {/* Divider */}
                <div className="w-px h-8 bg-slate-600/50 mx-1" />

                {/* Leave Button */}
                <button
                    onClick={onLeave}
                    className="px-6 py-3 rounded-full bg-red-500 hover:bg-red-400 text-white font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
                    title="Leave Meeting"
                >
                    Leave
                </button>
            </div>
        </div>
    );
}
