'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RoomCodeModal from '@/components/RoomCodeModal';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load saved username from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('roommatch-username');
    if (saved) setUsername(saved);
  }, []);

  // Save username
  useEffect(() => {
    if (username.trim()) {
      localStorage.setItem('roommatch-username', username.trim());
    }
  }, [username]);

  // ── Create Room ─────────────────────────────────────────────────────────────
  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/create`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setCreatedRoomCode(data.code);
        setShowModal(true);
      } else {
        setError(data.message || 'Failed to create room');
      }
    } catch {
      setError('Cannot connect to server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  // ── Join Room ───────────────────────────────────────────────────────────────
  const handleJoinRoom = async () => {
    if (!username.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim() || roomCode.length !== 8) {
      setError('Please enter a valid 8-digit room code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/${roomCode}`);
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('roommatch-roomcode', roomCode);
        router.push(`/room/${roomCode}`);
      } else {
        setError(data.message || 'Room not found');
      }
    } catch {
      setError('Cannot connect to server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  // ── Join created room via modal ─────────────────────────────────────────────
  const handleJoinCreated = () => {
    setShowModal(false);
    localStorage.setItem('roommatch-roomcode', createdRoomCode);
    router.push(`/room/${createdRoomCode}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-4">
              <span className="text-3xl">🚀</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              RoomMatch
            </h1>
            <p className="text-slate-400 text-sm mt-1">Video Conferencing — Simplified</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center animate-shake">
              {error}
            </div>
          )}

          {/* Username Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              maxLength={30}
            />
          </div>

          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </span>
            ) : (
              '✨ Create New Meeting'
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-700/50" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">or join</span>
            <div className="flex-1 h-px bg-slate-700/50" />
          </div>

          {/* Room Code Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                setRoomCode(val);
              }}
              placeholder="Enter 8-digit code..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-600/50 text-white placeholder-slate-500 font-mono text-lg tracking-[0.2em] text-center focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              maxLength={8}
              inputMode="numeric"
            />
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoinRoom}
            disabled={loading || roomCode.length !== 8}
            className="w-full py-3.5 rounded-xl bg-slate-700/80 hover:bg-slate-600/80 text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🔗 Join Meeting
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Powered by WebRTC • Peer-to-peer encrypted
        </p>
      </div>

      <RoomCodeModal
        isOpen={showModal}
        roomCode={createdRoomCode}
        onClose={handleJoinCreated}
      />
    </div>
  );
}
