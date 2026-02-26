'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
    username: string;
    message: string;
    timestamp: string;
    socketId: string;
}

interface ChatPanelProps {
    isOpen: boolean;
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    onClose: () => void;
    currentSocketId: string;
}

export default function ChatPanel({
    isOpen,
    messages,
    onSendMessage,
    onClose,
    currentSocketId,
}: ChatPanelProps) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        onSendMessage(trimmed);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (ts: string) => {
        try {
            return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    return (
        <div
            className={`fixed inset-x-0 top-0 bottom-20 sm:inset-y-0 sm:left-auto sm:w-96 z-[60] transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
        >
            <div className="h-full flex flex-col bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Chat
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-500 py-8">
                            <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-sm">No messages yet</p>
                            <p className="text-xs text-slate-600">Say hello to everyone!</p>
                        </div>
                    )}

                    {messages.map((msg, i) => {
                        const isOwn = msg.socketId === currentSocketId;
                        return (
                            <div key={i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isOwn
                                        ? 'bg-indigo-500/90 text-white rounded-br-md'
                                        : 'bg-slate-700/80 text-slate-100 rounded-bl-md'
                                        }`}
                                >
                                    {!isOwn && (
                                        <p className="text-xs font-semibold text-indigo-300 mb-0.5">{msg.username}</p>
                                    )}
                                    <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                                    <p className={`text-[10px] mt-1 ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {formatTime(msg.timestamp)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-700/50">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:hover:bg-indigo-500 text-white transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
