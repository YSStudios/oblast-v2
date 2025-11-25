"use client";

import * as THREE from "three";
import { useRef, useState, useCallback, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, RenderTexture, Text, Billboard, Line } from "@react-three/drei";
import { useScreenFocus } from "./ScreenFocusContext";
import { CAMERA_FOCUS_CONFIG } from "./config";
import type { ScreenProps, GLTFResult } from "./types";

export function Screen({
  frame,
  panel,
  children,
  name,
  description,
  url,
  labelYOffset: customLabelYOffset,
  descriptionOffset,
  panelChildren,
  zoomDistanceMultiplier,
  ...props
}: ScreenProps & { panelChildren?: React.ReactNode }) {
  const { nodes, materials } = useGLTF(
    "/models/computers_2.glb"
  ) as unknown as GLTFResult;
  const [hovered, setHovered] = useState(false);
  const textRef = useRef<THREE.Mesh>(null);
  const panelRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [displayText, setDisplayText] = useState("");
  const animationProgress = useRef(0);
  const [lineStart, setLineStart] = useState<[number, number, number]>([
    0, 1.2, -0.15,
  ]);
  const [darkenOpacity, setDarkenOpacity] = useState(0);
  const {
    focusTarget,
    setFocusTarget,
    isTransitioning,
    registerScreen,
    unregisterScreen,
    currentScreenId,
    setCurrentScreenId,
    zoomInComplete,
  } = useScreenFocus();
  const { camera } = useThree();
  const screenId = panel; // Use panel name as unique ID
  const isFocused = currentScreenId === screenId; // Check if this screen is focused
  // Use high resolution during zoom transition AND when focused
  const shouldUseHighRes = isFocused || (focusTarget && currentScreenId === screenId);

  // Calculate optimal camera position for this screen
  const handleScreenClick = useCallback(() => {
    if (!panelRef.current || !groupRef.current) return;

    // If this screen is already focused, do nothing (only ESC key can unfocus)
    if (currentScreenId === screenId && focusTarget && !isTransitioning) {
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
    // This represents the direction the screen is facing
    const worldMatrix = panelRef.current.matrixWorld;
    const normalWorld = new THREE.Vector3();

    // The Z-axis of the transformation matrix is the forward direction
    // Extract it from the matrix (third column, rows 0-2)
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
      (zoomDistanceMultiplier ?? CAMERA_FOCUS_CONFIG.distanceMultiplier);

    // Position camera directly in front of the screen along its normal
    const cameraPosition = center
      .clone()
      .add(normalWorld.clone().multiplyScalar(distance));

    setFocusTarget({
      cameraPosition: [cameraPosition.x, cameraPosition.y, cameraPosition.z],
      lookAt: [center.x, center.y, center.z],
      originalPosition,
      originalQuaternion,
      originalNear,
      originalFar,
    });
    setCurrentScreenId(screenId);
  }, [
    focusTarget,
    setFocusTarget,
    camera,
    isTransitioning,
    screenId,
    currentScreenId,
    setCurrentScreenId,
    zoomDistanceMultiplier,
  ]);

  // Register this screen on mount, unregister on unmount
  useEffect(() => {
    registerScreen(
      screenId,
      handleScreenClick,
      panelRef,
      name,
      description,
      url,
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
    url,
    descriptionOffset,
  ]);

  // Generate random character
  const randomChar = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    return chars[Math.floor(Math.random() * chars.length)];
  };

  // Calculate line start position from LCD screen and animate text reveal
  useFrame((state, delta) => {
    // Update darkening opacity for non-focused screens (only when changing)
    if (focusTarget && zoomInComplete && !isFocused) {
      setDarkenOpacity((prev: number) => {
        const next = Math.min(prev + delta * 2, 0.7);
        return Math.abs(next - prev) > 0.01 ? next : prev;
      });
    } else {
      setDarkenOpacity((prev: number) => {
        const next = Math.max(prev - delta * 3, 0);
        return Math.abs(next - prev) > 0.01 ? next : prev;
      });
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

  const labelYOffset = customLabelYOffset ?? 1.2; // Distance above screen (center of billboard)
  const labelZOffset = 0.4; // Forward offset to create diagonal line (closer to monitor)
  const lineEndY = lineStart[1] + labelYOffset - 0.2; // Connect line below text

  return (
    <group ref={groupRef} {...props}>
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes[frame] as THREE.Mesh).geometry}
        material={materials.Texture}
      />
      <mesh
        ref={panelRef}
        geometry={(nodes[panel] as THREE.Mesh).geometry}
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
        <meshBasicMaterial toneMapped={false}>
          <RenderTexture
            width={shouldUseHighRes ? 512 : 256}
            height={shouldUseHighRes ? 512 : 256}
            attach="map"
            anisotropy={shouldUseHighRes ? 16 : 8}
            frames={Infinity}
          >
            {children}
          </RenderTexture>
        </meshBasicMaterial>
      </mesh>

      {/* Render panelChildren outside the mesh to avoid bounding box issues */}
      {panelChildren}

      {/* Darkening overlay for non-focused screens */}
      {darkenOpacity > 0.01 && (
        <mesh
          geometry={(nodes[panel] as THREE.Mesh).geometry}
          position={[0, 0, 0.001]}
          renderOrder={1}
        >
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={darkenOpacity}
            depthTest={true}
            depthWrite={false}
          />
        </mesh>
      )}

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

