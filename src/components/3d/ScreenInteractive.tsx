"use client";

import * as THREE from "three";
import { useState, useEffect, useMemo, useRef } from "react";
import { PerspectiveCamera, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import Hls, { type ErrorData } from "hls.js";
import { Screen } from "./Screen";
import { useScreenFocus } from "./ScreenFocusContext";
import { GeometricLoadingScreen } from "./GeometricLoadingScreen";
import { BiosScreen } from "./BiosScreen";
import { ThreeMeshUIMenu } from "./ThreeMeshUIMenu";
import type { ScreenInteractiveProps, GLTFResult } from "./types";

export function ScreenInteractive({
  name,
  description,
  labelYOffset,
  descriptionOffset,
  zoomDistanceMultiplier,
  muxPlaybackId,
  ...props
}: ScreenInteractiveProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const { currentScreenId, zoomInComplete, clearFocus } = useScreenFocus();
  const isFocused = currentScreenId === props.panel && zoomInComplete;
  const hlsRef = useRef<Hls | null>(null);
  const { nodes } = useGLTF("/models/computers_2.glb") as unknown as GLTFResult;

  // Create video and texture with useMemo (only on mount or when playbackId changes)
  const { videoElement, videoTexture } = useMemo(() => {
    if (!muxPlaybackId) {
      return { videoElement: null, videoTexture: null };
    }

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.format = THREE.RGBAFormat;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = true;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    return { videoElement: video, videoTexture: texture };
  }, [muxPlaybackId]);

  // Update video texture every frame
  useFrame(() => {
    if (
      videoElement &&
      videoTexture &&
      videoElement.readyState >= videoElement.HAVE_CURRENT_DATA
    ) {
      videoTexture.needsUpdate = true;
    }
  });

  // Setup HLS and video loading
  useEffect(() => {
    if (!muxPlaybackId || !videoElement) return;

    const videoSrc = `https://stream.mux.com/${muxPlaybackId}.m3u8`;

    console.log("ScreenInteractive: Loading Mux video", {
      muxPlaybackId,
      videoSrc,
      hlsSupported: Hls.isSupported(),
    });

    const handleError = (e: Event) => {
      console.error("Video element error:", e);
    };

    videoElement.addEventListener("error", handleError);

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        debug: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        backBufferLength: 30,
      });

      hlsRef.current = hls;
      hls.loadSource(videoSrc);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS manifest parsed, attempting to play...");
        videoElement.play().catch((err: Error) => {
          console.error("Error playing video:", err);
        });
      });

      hls.on(Hls.Events.ERROR, (_event: string, data: ErrorData) => {
        const hasValidErrorData =
          (data.type !== undefined && data.type !== null) ||
          (data.details !== undefined && data.details !== null) ||
          data.fatal === true ||
          (data.error !== undefined && data.error !== null);

        if (hasValidErrorData && !data.fatal) {
          console.warn("HLS non-fatal error:", {
            type: data.type,
            details: data.details,
            error: data.error,
            message: data.error?.message,
            muxPlaybackId,
            videoSrc,
          });
        }

        if (data.fatal) {
          console.error("HLS fatal error:", {
            type: data.type,
            details: data.details,
            error: data.error,
            message: data.error?.message,
            response: data.response,
            muxPlaybackId,
            videoSrc,
            fullData: JSON.stringify(data, null, 2),
          });
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error(
                "Fatal network error encountered, trying to recover",
                data.details
              );
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error(
                "Fatal media error encountered, trying to recover",
                data.details
              );
              hls.recoverMediaError();
              break;
            default:
              console.error(
                "Fatal error, cannot recover. Type:",
                data.type,
                "Details:",
                data.details
              );
              hls.destroy();
              break;
          }
        }
      });
    }
    // Safari has native HLS support
    else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
      console.log("Using native HLS support");
      videoElement.src = videoSrc;
      videoElement.play().catch((err: Error) => {
        console.error("Error playing video:", err);
      });
    } else {
      console.error("HLS is not supported in this browser");
    }

    return () => {
      videoElement.removeEventListener("error", handleError);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      videoElement.pause();
      videoElement.src = "";
      if (videoTexture) {
        videoTexture.dispose();
      }
    };
  }, [muxPlaybackId, videoElement, videoTexture]);

  // Add delay after zoom completes before showing menu
  useEffect(() => {
    if (isFocused) {
      // Show loading screen for 2 seconds after zoom completes
      const timer = setTimeout(() => {
        setLoadingComplete(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // Reset loading state when not focused
      setLoadingComplete(false);
    }
  }, [isFocused]);

  return (
    <Screen
      {...props}
      name={name}
      description={description}
      labelYOffset={labelYOffset}
      descriptionOffset={descriptionOffset}
      zoomDistanceMultiplier={zoomDistanceMultiplier}
      panelChildren={
        <>
          {isFocused ? (
            loadingComplete ? (
              <ThreeMeshUIMenu
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                onExit={clearFocus}
              />
            ) : (
              <BiosScreen />
            )
          ) : null}

          {/* Video overlay when not focused and muxPlaybackId is provided */}
          {!isFocused && muxPlaybackId && videoTexture && (
            <mesh position={[0, 0.45, 0.2]}>
              <planeGeometry args={[1.3, 1.3]} />
              <meshBasicMaterial map={videoTexture} toneMapped={false} />
            </mesh>
          )}
        </>
      }
    >
      <PerspectiveCamera
        makeDefault
        manual
        aspect={1 / 1}
        position={[0, 0, 15]}
      />
      <color attach="background" args={["#0a0a0a"]} />
      <ambientLight intensity={Math.PI / 2} />
      <pointLight decay={0} position={[10, 10, 10]} intensity={Math.PI} />
      <pointLight decay={0} position={[-10, -10, -10]} />

      {/* Show geometric loading screen when not focused and no video */}
      {!isFocused && !muxPlaybackId && (
        <GeometricLoadingScreen scale={0.4} position={[-4.6, 1.1, 0]} />
      )}
    </Screen>
  );
}
