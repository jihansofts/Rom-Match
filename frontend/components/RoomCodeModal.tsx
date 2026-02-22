'use client';

import React from 'react';

interface RoomCodeModalProps {
    isOpen: boolean;
    roomCode: string;
    onClose: () => void;
}

export default function RoomCodeModal({ isOpen, roomCode, onClose }: RoomCodeModalProps) {
    const [copied, setCopied] = React.useState(false);

    if (!isOpen) return null;

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Room Created!</h3>
                    <p className="text-slate-400 text-sm mb-6">Share this code with others to join the meeting</p>

                    <div className="bg-slate-900/80 border border-slate-600/50 rounded-xl p-4 mb-6">
                        <p className="text-3xl font-mono font-bold text-indigo-400 tracking-[0.3em]">
                            {roomCode}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={copyCode}
                            className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {copied ? '✓ Copied!' : 'Copy Code'}
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Join Room
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
