'use client';

import { useState, useCallback, useRef } from 'react';

export function useMediaStream() {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const screenStreamRef = useRef<MediaStream | null>(null);

    // ── Get camera + mic ────────────────────────────────────────────────────────
    const startLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            setLocalStream(stream);
            setIsMicOn(true);
            setIsCameraOn(true);
            return stream;
        } catch (error) {
            console.error('Failed to get media stream:', error);
            // Try audio only
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: true,
                });
                setLocalStream(audioStream);
                setIsMicOn(true);
                setIsCameraOn(false);
                return audioStream;
            } catch (audioError) {
                console.error('Failed to get audio stream:', audioError);
                throw audioError;
            }
        }
    }, []);

    // ── Toggle microphone ───────────────────────────────────────────────────────
    const toggleMic = useCallback(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsMicOn((prev) => !prev);
        }
    }, [localStream]);

    // ── Toggle camera ──────────────────────────────────────────────────────────
    const toggleCamera = useCallback(() => {
        if (localStream) {
            localStream.getVideoTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsCameraOn((prev) => !prev);
        }
    }, [localStream]);

    // ── Start screen share ─────────────────────────────────────────────────────
    const startScreenShare = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' } as MediaTrackConstraints,
                audio: false,
            });

            screenStreamRef.current = stream;
            setScreenStream(stream);
            setIsScreenSharing(true);

            // When user stops sharing via browser UI
            stream.getVideoTracks()[0].onended = () => {
                setScreenStream(null);
                setIsScreenSharing(false);
                screenStreamRef.current = null;
            };

            return stream;
        } catch (error) {
            console.error('Failed to start screen share:', error);
            return null;
        }
    }, []);

    // ── Stop screen share ──────────────────────────────────────────────────────
    const stopScreenShare = useCallback(() => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = null;
        }
        setScreenStream(null);
        setIsScreenSharing(false);
    }, []);

    // ── Cleanup all streams ────────────────────────────────────────────────────
    const cleanup = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        setLocalStream(null);
        setScreenStream(null);
        setIsScreenSharing(false);
    }, [localStream]);

    return {
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
        cleanup,
    };
}

export default useMediaStream;
