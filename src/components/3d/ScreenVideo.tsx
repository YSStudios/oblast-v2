"use client";

import * as THREE from "three";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Text, Billboard, Line } from "@react-three/drei";
import Hls, { type ErrorData } from "hls.js";
import { useScreenFocus } from "./ScreenFocusContext";
import { CAMERA_FOCUS_CONFIG } from "./config";
import type { ScreenVideoProps, GLTFResult } from "./types";

export function ScreenVideo({
  description,
  muxPlaybackId,
  name,
  labelYOffset: customLabelYOffset,
  descriptionOffset,
  ...props
}: ScreenVideoProps) {
  const { nodes, materials } = useGLTF(
    "/models/computers_2.glb"
  ) as unknown as GLTFResult;
  const hlsRef = useRef<Hls | null>(null);
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const panelRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Mesh>(null);
  const [videoAspect, setVideoAspect] = useState(16 / 9); // Default aspect ratio
  const [displayText, setDisplayText] = useState("");
  const animationProgress = useRef(0);
  const [lineStart, setLineStart] = useState<[number, number, number]>([
    0, 1.2, -0.15,
  ]);

  // Focus functionality
  const {
    focusTarget,
    setFocusTarget,
    clearFocus,
    isTransitioning,
    registerScreen,
    unregisterScreen,
    currentScreenId,
    setCurrentScreenId,
  } = useScreenFocus();
  const { camera } = useThree();
  const screenId = props.panel; // Use panel name as unique ID

  // Calculate optimal camera position for this screen
  const handleScreenClick = useCallback(() => {
    if (!panelRef.current || !groupRef.current) return;

    // If this screen is already focused, unfocus it
    if (currentScreenId === screenId && focusTarget && !isTransitioning) {
      clearFocus();
      return;
    }

    // Capture current camera state before focusing
    const originalPosition: [number, number, number] = [
      camera.position.x,
      camera.position.y,
      camera.position.z,
    ];
    const originalQuaternion: [number, number, number, number] = [
      camera.quaternion.x,
      camera.quaternion.y,
      camera.quaternion.z,
      camera.quaternion.w,
    ];
    const originalNear = (camera as THREE.PerspectiveCamera).near;
    const originalFar = (camera as THREE.PerspectiveCamera).far;

    // Update matrices to get accurate world positions
    panelRef.current.updateWorldMatrix(true, false);
    groupRef.current.updateWorldMatrix(true, false);

    // Get screen center in world coordinates
    const bbox = new THREE.Box3().setFromObject(panelRef.current);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Extract the screen's Z-axis (forward direction) from its world matrix
    const worldMatrix = panelRef.current.matrixWorld;
    const normalWorld = new THREE.Vector3();
    normalWorld
      .set(
        worldMatrix.elements[8],
        worldMatrix.elements[9],
        worldMatrix.elements[10]
      )
      .normalize();

    // Calculate screen dimensions for proper framing
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const screenHeight = Math.max(size.x, size.y);

    // Calculate distance needed to frame the screen nicely
    const fov = CAMERA_FOCUS_CONFIG.fov * (Math.PI / 180);
    const distance =
      (screenHeight / 2 / Math.tan(fov / 2)) *
      CAMERA_FOCUS_CONFIG.distanceMultiplier;

    // Position camera in front of the screen
    const targetPosition = new THREE.Vector3()
      .copy(center)
      .add(normalWorld.multiplyScalar(distance));

    // Store focus state
    setFocusTarget({
      cameraPosition: [targetPosition.x, targetPosition.y, targetPosition.z],
      lookAt: [center.x, center.y, center.z],
      originalPosition,
      originalQuaternion,
      originalNear,
      originalFar,
    });
    setCurrentScreenId(screenId);
  }, [
    camera,
    focusTarget,
    isTransitioning,
    clearFocus,
    setFocusTarget,
    currentScreenId,
    screenId,
    setCurrentScreenId,
  ]);

  // Register this screen on mount
  useEffect(() => {
    registerScreen(
      screenId,
      handleScreenClick,
      panelRef,
      name,
      description,
      descriptionOffset
    );
    return () => {
      unregisterScreen(screenId);
    };
  }, [
    screenId,
    handleScreenClick,
    registerScreen,
    unregisterScreen,
    name,
    description,
    descriptionOffset,
  ]);

  // Create video and texture with useMemo (only on mount or when playbackId changes)
  const { videoElement, videoTexture } = useMemo(() => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    const texture = new THREE.VideoTexture(video);
    // Use LinearFilter without mipmaps for sharper rendering
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false; // Disable mipmaps for sharper video
    texture.format = THREE.RGBAFormat;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = true; // Flip vertically to fix upside down video
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    return { videoElement: video, videoTexture: texture };
  }, []);

  // Generate random character
  const randomChar = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    return chars[Math.floor(Math.random() * chars.length)];
  };

  // Update texture every frame and handle hover animations
  useFrame((state, delta) => {
    if (videoElement.readyState >= videoElement.HAVE_CURRENT_DATA) {
      // eslint-disable-next-line
      videoTexture.needsUpdate = true;
    }

    // Update line position when hovered - convert world to local coordinates (throttle updates)
    if (
      panelRef.current &&
      groupRef.current &&
      hovered &&
      Math.floor(state.clock.elapsedTime * 20) % 2 === 0
    ) {
      // Update matrices
      panelRef.current.updateWorldMatrix(true, false);
      groupRef.current.updateWorldMatrix(true, false);

      // Get bounding box in world space
      const bbox = new THREE.Box3().setFromObject(panelRef.current);
      const center = new THREE.Vector3();
      bbox.getCenter(center);

      // Get the top center of the screen in world coordinates
      const worldPos = new THREE.Vector3(center.x, bbox.max.y, center.z);

      // Convert world position to local coordinates of the group
      groupRef.current.worldToLocal(worldPos);
      const newStart: [number, number, number] = [
        worldPos.x,
        worldPos.y,
        worldPos.z,
      ];

      // Only update if significantly different to avoid unnecessary rerenders
      if (
        Math.abs(newStart[0] - lineStart[0]) > 0.01 ||
        Math.abs(newStart[1] - lineStart[1]) > 0.01 ||
        Math.abs(newStart[2] - lineStart[2]) > 0.01
      ) {
        setLineStart(newStart);
      }
    }

    // Animate text reveal (throttle updates for performance)
    if (hovered && name) {
      animationProgress.current += delta * 1.5; // Speed of animation

      if (animationProgress.current >= 1) {
        if (displayText !== name) {
          setDisplayText(name);
        }
      } else if (Math.floor(state.clock.elapsedTime * 30) % 2 === 0) {
        const progress = animationProgress.current;
        const revealedChars = Math.floor(name.length * progress);

        let newText = "";
        for (let i = 0; i < name.length; i++) {
          if (i < revealedChars) {
            newText += name[i];
          } else if (name[i] === " ") {
            newText += " ";
          } else {
            newText += randomChar();
          }
        }
        setDisplayText(newText);
      }
    } else {
      if (animationProgress.current !== 0) {
        animationProgress.current = 0;
      }
      if (displayText !== "") {
        setDisplayText("");
      }
    }
  });

  // Fix UV coordinates to ensure proper texture mapping
  useEffect(() => {
    if (!panelRef.current) return;

    const geometry = panelRef.current.geometry;
    const uvAttribute = geometry.attributes.uv;

    if (uvAttribute) {
      console.log(
        `Screen ${props.panel} UV coords before:`,
        uvAttribute.array.slice(0, 8)
      );

      // Clone the geometry to avoid modifying the shared GLTF geometry
      const newGeometry = geometry.clone();
      const newUvs = newGeometry.attributes.uv;

      // Find the min/max UV values to understand the current mapping
      let minU = Infinity,
        maxU = -Infinity;
      let minV = Infinity,
        maxV = -Infinity;

      for (let i = 0; i < newUvs.count; i++) {
        const u = newUvs.getX(i);
        const v = newUvs.getY(i);
        minU = Math.min(minU, u);
        maxU = Math.max(maxU, u);
        minV = Math.min(minV, v);
        maxV = Math.max(maxV, v);
      }

      console.log(
        `Screen ${props.panel} UV range: U[${minU}, ${maxU}], V[${minV}, ${maxV}]`
      );

      // Normalize UVs to 0-1 range
      for (let i = 0; i < newUvs.count; i++) {
        const u = newUvs.getX(i);
        const v = newUvs.getY(i);
        const normalizedU = (u - minU) / (maxU - minU);
        const normalizedV = (v - minV) / (maxV - minV);
        newUvs.setXY(i, normalizedU, normalizedV);
      }

      newUvs.needsUpdate = true;
      panelRef.current.geometry = newGeometry;

      console.log(
        `Screen ${props.panel} UV coords after:`,
        newUvs.array.slice(0, 8)
      );
    }
  }, [nodes, props.panel]);

  // Setup HLS and video loading
  useEffect(() => {
    const videoSrc = `https://stream.mux.com/${muxPlaybackId}.m3u8`;

    const handleLoadedMetadata = () => {
      if (videoElement.videoWidth && videoElement.videoHeight) {
        const aspect = videoElement.videoWidth / videoElement.videoHeight;
        setVideoAspect(aspect);
      }
    };

    const handleError = (e: Event) => {
      console.error("Video element error:", e);
    };

    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
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
        // Only log if we have actual meaningful error data
        const hasValidErrorData =
          (data.type !== undefined && data.type !== null) ||
          (data.details !== undefined && data.details !== null) ||
          (data.fatal === true) ||
          (data.error !== undefined && data.error !== null);

        // Only log non-fatal errors with actual data
        if (hasValidErrorData && !data.fatal) {
          console.warn("HLS non-fatal error:", {
            type: data.type,
            details: data.details,
            error: data.error,
            muxPlaybackId,
          });
        }

        if (data.fatal) {
          console.error("HLS fatal error:", {
            type: data.type,
            details: data.details,
            error: data.error,
            muxPlaybackId,
          });
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error(
                "Fatal network error encountered, trying to recover"
              );
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("Fatal media error encountered, trying to recover");
              hls.recoverMediaError();
              break;
            default:
              console.error("Fatal error, cannot recover");
              hls.destroy();
              break;
          }
        }
      });
    }
    // Safari has native HLS support
    else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
      console.log("Using native HLS support");
      // eslint-disable-next-line
      videoElement.src = videoSrc;
      videoElement.play().catch((err: Error) => {
        console.error("Error playing video:", err);
      });
    } else {
      console.error("HLS is not supported in this browser");
    }

    return () => {
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.removeEventListener("error", handleError);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      videoElement.pause();
      videoElement.src = "";
      videoTexture.dispose();
    };
  }, [muxPlaybackId, videoElement, videoTexture]);

  // Calculate texture scaling to fit video within screen (contain mode)
  useEffect(() => {
    if (!panelRef.current) return;

    // Get screen mesh bounding box to calculate its aspect ratio
    const geometry = (nodes[props.panel] as THREE.Mesh).geometry;
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;

    if (bbox) {
      const screenWidth = bbox.max.x - bbox.min.x;
      const screenHeight = bbox.max.y - bbox.min.y;
      const screenAspect = screenWidth / screenHeight;

      // Calculate scale to fit video within screen (contain mode)
      let scaleX = 1;
      let scaleY = 1;

      if (videoAspect > screenAspect) {
        // Video is wider than screen - fit to width
        scaleY = screenAspect / videoAspect;
      } else {
        // Video is taller than screen - fit to height
        scaleX = videoAspect / screenAspect;
      }

      // Apply scaling and center the texture
      videoTexture.repeat.set(scaleX, scaleY);
      videoTexture.offset.set((1 - scaleX) / 2, (1 - scaleY) / 2);
    }
  }, [videoAspect, videoTexture, nodes, props.panel]);

  const labelYOffset = customLabelYOffset ?? 1.2; // Distance above screen (center of billboard)
  const labelZOffset = 0.4; // Forward offset to create diagonal line (closer to monitor)
  const lineEndY = lineStart[1] + labelYOffset - 0.2; // Connect line below text

  return (
    <group ref={groupRef} {...props}>
      {/* Frame mesh */}
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes[props.frame] as THREE.Mesh).geometry}
        material={materials.Texture}
      />

      {/* Panel mesh with video texture */}
      <mesh
        ref={panelRef}
        geometry={(nodes[props.panel] as THREE.Mesh).geometry}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleScreenClick();
        }}
      >
        <meshBasicMaterial
          map={videoTexture}
          toneMapped={false}
          color="#808080"
        />
      </mesh>

      {hovered && name && !focusTarget && (
        <>
          {/* Line connecting top of LCDScreen to label */}
          <Line
            points={[
              lineStart,
              [lineStart[0], lineEndY, lineStart[2] + labelZOffset],
            ]}
            color="#35c19f"
            lineWidth={2}
            dashed={false}
            renderOrder={998}
            depthTest={false}
            transparent
            opacity={0.9}
          />

          <Billboard
            follow={true}
            lockX={false}
            lockY={false}
            lockZ={false}
            position={[
              lineStart[0],
              lineStart[1] + labelYOffset,
              lineStart[2] + labelZOffset,
            ]}
          >
            {/* Text */}
            <Text
              ref={textRef}
              position={[0, 0, 0.001]}
              fontSize={0.16}
              color="#35c19f"
              anchorX="center"
              anchorY="middle"
              font="/fonts/Inter-Medium.woff"
              depthOffset={-1}
              renderOrder={1002}
              material-depthTest={false}
              material-depthWrite={false}
            >
              {displayText}
            </Text>
          </Billboard>
        </>
      )}
    </group>
  );
}

