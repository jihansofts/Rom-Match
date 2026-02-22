'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface RemoteStream {
    socketId: string;
    username: string;
    stream: MediaStream;
}

interface UseWebRTCProps {
    socket: Socket;
    roomCode: string;
    username: string;
    localStream: MediaStream | null;
}

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ],
};

export function useWebRTC({ socket, roomCode, username, localStream }: UseWebRTCProps) {
    const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
    const remoteUsernames = useRef<Map<string, string>>(new Map());

    // ── Create peer connection for a given socket ID ─────────────────────────────
    const createPeerConnection = useCallback(
        (remoteSocketId: string, remoteUsername: string) => {
            // Avoid duplicate connections
            if (peerConnections.current.has(remoteSocketId)) {
                return peerConnections.current.get(remoteSocketId)!;
            }

            remoteUsernames.current.set(remoteSocketId, remoteUsername);

            const pc = new RTCPeerConnection(ICE_SERVERS);

            // Add local tracks to the connection
            if (localStream) {
                localStream.getTracks().forEach((track) => {
                    pc.addTrack(track, localStream);
                });
            }

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice-candidate', {
                        to: remoteSocketId,
                        candidate: event.candidate.toJSON(),
                    });
                }
            };

            // Handle remote track
            pc.ontrack = (event) => {
                const [remoteStream] = event.streams;
                if (remoteStream) {
                    setRemoteStreams((prev) => {
                        const exists = prev.find((s) => s.socketId === remoteSocketId);
                        if (exists) {
                            // Update existing stream
                            return prev.map((s) =>
                                s.socketId === remoteSocketId ? { ...s, stream: remoteStream } : s
                            );
                        }
                        return [
                            ...prev,
                            {
                                socketId: remoteSocketId,
                                username: remoteUsernames.current.get(remoteSocketId) || 'Unknown',
                                stream: remoteStream,
                            },
                        ];
                    });
                }
            };

            pc.oniceconnectionstatechange = () => {
                if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                    console.warn(`ICE connection state: ${pc.iceConnectionState} for ${remoteSocketId}`);
                }
            };

            peerConnections.current.set(remoteSocketId, pc);
            return pc;
        },
        [socket, localStream]
    );

    // ── Process queued ICE candidates ───────────────────────────────────────────
    const processPendingCandidates = useCallback(async (socketId: string) => {
        const candidates = pendingCandidates.current.get(socketId);
        const pc = peerConnections.current.get(socketId);

        if (candidates && pc && pc.remoteDescription) {
            for (const candidate of candidates) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error('Error adding queued ICE candidate:', err);
                }
            }
            pendingCandidates.current.delete(socketId);
        }
    }, []);

    // ── Handle existing users (create offers to each) ───────────────────────────
    useEffect(() => {
        if (!socket || !localStream) return;

        const handleExistingUsers = async ({ users }: { users: { socketId: string; username: string }[] }) => {
            for (const user of users) {
                const pc = createPeerConnection(user.socketId, user.username);

                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);

                    socket.emit('offer', {
                        to: user.socketId,
                        offer: pc.localDescription,
                    });
                } catch (err) {
                    console.error('Error creating offer:', err);
                }
            }
        };

        socket.on('existing-users', handleExistingUsers);
        return () => {
            socket.off('existing-users', handleExistingUsers);
        };
    }, [socket, localStream, createPeerConnection]);

    // ── Handle new user joining (they'll send us an offer) ──────────────────────
    useEffect(() => {
        if (!socket || !localStream) return;

        const handleUserJoined = ({ socketId, username }: { socketId: string; username: string }) => {
            // Pre-create the peer connection so it's ready for incoming offer
            createPeerConnection(socketId, username);
        };

        socket.on('user-joined', handleUserJoined);
        return () => {
            socket.off('user-joined', handleUserJoined);
        };
    }, [socket, localStream, createPeerConnection]);

    // ── Handle incoming offer ───────────────────────────────────────────────────
    useEffect(() => {
        if (!socket || !localStream) return;

        const handleOffer = async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
            const remName = remoteUsernames.current.get(from) || 'Unknown';
            const pc = createPeerConnection(from, remName);

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.emit('answer', {
                    to: from,
                    answer: pc.localDescription,
                });

                await processPendingCandidates(from);
            } catch (err) {
                console.error('Error handling offer:', err);
            }
        };

        socket.on('offer', handleOffer);
        return () => {
            socket.off('offer', handleOffer);
        };
    }, [socket, localStream, createPeerConnection, processPendingCandidates]);

    // ── Handle incoming answer ──────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleAnswer = async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
            const pc = peerConnections.current.get(from);
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    await processPendingCandidates(from);
                } catch (err) {
                    console.error('Error handling answer:', err);
                }
            }
        };

        socket.on('answer', handleAnswer);
        return () => {
            socket.off('answer', handleAnswer);
        };
    }, [socket, processPendingCandidates]);

    // ── Handle ICE candidates ──────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleIceCandidate = async ({
            from,
            candidate,
        }: {
            from: string;
            candidate: RTCIceCandidateInit;
        }) => {
            const pc = peerConnections.current.get(from);

            if (pc && pc.remoteDescription) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error('Error adding ICE candidate:', err);
                }
            } else {
                // Queue candidates until remote description is set
                if (!pendingCandidates.current.has(from)) {
                    pendingCandidates.current.set(from, []);
                }
                pendingCandidates.current.get(from)!.push(candidate);
            }
        };

        socket.on('ice-candidate', handleIceCandidate);
        return () => {
            socket.off('ice-candidate', handleIceCandidate);
        };
    }, [socket]);

    // ── Handle user leaving ────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleUserLeft = ({ socketId }: { socketId: string }) => {
            const pc = peerConnections.current.get(socketId);
            if (pc) {
                pc.close();
                peerConnections.current.delete(socketId);
            }
            pendingCandidates.current.delete(socketId);
            remoteUsernames.current.delete(socketId);

            setRemoteStreams((prev) => prev.filter((s) => s.socketId !== socketId));
        };

        socket.on('user-left', handleUserLeft);
        return () => {
            socket.off('user-left', handleUserLeft);
        };
    }, [socket]);

    // ── Replace track in all peer connections (for screen share) ────────────────
    const replaceTrack = useCallback(
        async (newStream: MediaStream, kind: 'video' | 'audio') => {
            const newTrack = kind === 'video' ? newStream.getVideoTracks()[0] : newStream.getAudioTracks()[0];
            if (!newTrack) return;

            peerConnections.current.forEach((pc) => {
                const sender = pc.getSenders().find((s) => s.track?.kind === kind);
                if (sender) {
                    sender.replaceTrack(newTrack);
                }
            });
        },
        []
    );

    // ── Cleanup all connections ─────────────────────────────────────────────────
    const cleanup = useCallback(() => {
        peerConnections.current.forEach((pc) => pc.close());
        peerConnections.current.clear();
        pendingCandidates.current.clear();
        remoteUsernames.current.clear();
        setRemoteStreams([]);
    }, []);

    return {
        remoteStreams,
        replaceTrack,
        cleanup,
    };
}

export default useWebRTC;
