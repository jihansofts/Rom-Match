"use client";

import { useState, useCallback, useRef } from "react";

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
          facingMode: "user",
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
      console.error("Failed to get media stream:", error);

      // Fallback: audio only, with a dummy video track for WebRTC consistency
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        let dummyTrack: MediaStreamTrack | null = null;

        try {
          const canvas = document.createElement("canvas");
          canvas.width = 1;
          canvas.height = 1;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, 1, 1);
          }

          const canvasWithCapture = canvas as HTMLCanvasElement & {
            captureStream?: (frameRate?: number) => MediaStream;
            mozCaptureStream?: (frameRate?: number) => MediaStream;
          };

          const dummyStream =
            typeof canvasWithCapture.captureStream === "function"
              ? canvasWithCapture.captureStream(1)
              : typeof canvasWithCapture.mozCaptureStream === "function"
                ? canvasWithCapture.mozCaptureStream(1)
                : null;

          if (dummyStream) {
            const track = dummyStream.getVideoTracks()[0];
            if (track) {
              track.enabled = true; // keep enabled so some browsers keep audio flowing
              dummyTrack = track;
            }
          }
        } catch (e) {
          console.error("Failed to create dummy track:", e);
        }

        if (dummyTrack) {
          audioStream.addTrack(dummyTrack);
        }

        setLocalStream(audioStream);
        setIsMicOn(true);
        setIsCameraOn(false);
        return audioStream;
      } catch (audioError) {
        console.error("Failed to get audio stream:", audioError);
        throw audioError;
      }
    }
  }, []);

  // ── Toggle microphone ───────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    if (!localStream) return;

    localStream.getAudioTracks().forEach((track: { enabled: boolean; }) => {
      track.enabled = !track.enabled;
    });

    setIsMicOn((prev: any) => !prev);
  }, [localStream]);

  // ── Toggle camera ──────────────────────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    if (!localStream) return;

    localStream.getVideoTracks().forEach((track: { enabled: boolean; }) => {
      track.enabled = !track.enabled;
    });

    setIsCameraOn((prev: any) => !prev);
  }, [localStream]);

  // ── Start screen share ─────────────────────────────────────────────────────
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as DisplayMediaStreamOptions["video"],
        audio: true,
      });

      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setScreenStream(null);
          setIsScreenSharing(false);
          screenStreamRef.current = null;
        };
      }

      return stream;
    } catch (error) {
      console.error("Failed to start screen share:", error);
      return null;
    }
  }, []);

  // ── Stop screen share ──────────────────────────────────────────────────────
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track: { stop: () => any; }) => track.stop());
      screenStreamRef.current = null;
    }

    setScreenStream(null);
    setIsScreenSharing(false);
  }, []);

  // ── Cleanup all streams ────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track: { stop: () => any; }) => track.stop());
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track: { stop: () => any; }) => track.stop());
      screenStreamRef.current = null;
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
