"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, MeshReflectorMaterial, BakeShadows } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  DepthOfField,
} from "@react-three/postprocessing";
import { easing } from "maath";
import { suspend } from "suspend-react";
import {
  Instances,
  Computers,
  ScreenFocusProvider,
  useScreenFocus,
  CAMERA_FOCUS_CONFIG,
} from "./Computers";
import type { Vector3, BufferGeometry } from "three";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const suzi = import("@pmndrs/assets/models/bunny.glb");

// Camera transition configuration - adjust these values to change how smoothly/fast the camera moves when focusing
const CAMERA_TRANSITION_CONFIG = {
  // Position damping: controls how fast the camera moves to the focus position
  // Lower = slower/smoother movement (e.g., 0.2), Higher = faster movement (e.g., 0.5)
  positionDamping: 0.3,
  
  // Rotation speed: controls how fast the camera rotates to look at the screen
  // Lower = slower rotation (e.g., delta * 2), Higher = faster rotation (e.g., delta * 5)
  rotationSpeed: 3,
} as const;

export default function Scene() {
  const [mounted, setMounted] = useState(false);

  // Ensure Canvas only renders on client to prevent R3F hook errors during hydration
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ width: "100%", height: "100vh", background: "black" }} />
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 1, 5.5], fov: 45, near: 1, far: 20 }}
        eventPrefix="client"
      >
      <ScreenFocusProvider>
        <color attach="background" args={["black"]} />
        <hemisphereLight intensity={0.15} groundColor="black" />
        <spotLight
          decay={0}
          position={[10, 20, 10]}
          angle={0.12}
          penumbra={1}
          intensity={1}
          castShadow
          shadow-mapSize={1024}
        />
        <group position={[0, -1, 0]}>
          <Instances>
            <Computers scale={0.5} />
          </Instances>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[50, 50]} />
            <MeshReflectorMaterial
              blur={[100, 10]}
              resolution={2048}
              mixBlur={0.5}
              mixStrength={80}
              roughness={1}
              depthScale={1.2}
              minDepthThreshold={0.4}
              maxDepthThreshold={1.4}
              color="#202020"
              metalness={0.8}
            />
          </mesh>
          <Bun
            scale={0.4}
            position={[0, 0.3, 0.5]}
            rotation={[0, -Math.PI * 0.85, 0]}
          />
          <pointLight
            distance={1.5}
            intensity={1}
            position={[-0.15, 0.7, 0]}
            color="orange"
          />
        </group>
        <Effects />
        <CameraRig />
        <BakeShadows />
      </ScreenFocusProvider>
    </Canvas>
    </div>
  );
}

interface BunProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

function Bun(props: BunProps) {
  const model = suspend(suzi) as { default: string };
  const { nodes } = useGLTF(model.default) as unknown as {
    nodes: { mesh: { geometry: BufferGeometry } };
  };
  return (
    <mesh receiveShadow castShadow geometry={nodes.mesh.geometry} {...props}>
      <meshStandardMaterial color="#222" roughness={0.5} />
    </mesh>
  );
}

function Effects() {
  const { focusTarget, isTransitioning } = useScreenFocus();
  
  // Disable depth of field when focused on a screen
  const isFocused = focusTarget !== null && !isTransitioning;
  
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0}
        mipmapBlur
        luminanceSmoothing={0}
        intensity={2}
      />
      {!isFocused && (
        <DepthOfField
          target={[0, 0, 5.5]}
          focalLength={0.05}
          bokehScale={2}
          height={700}
        />
      )}
    </EffectComposer>
  );
}

function CameraRig() {
  const {
    focusTarget,
    clearFocus,
    completeClearFocus,
    isTransitioning,
    transitionStartTime,
    mouseFollowEnabled,
    toggleMouseFollow,
    navigateNext,
    navigatePrevious,
  } = useScreenFocus();
  const previousPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const previousPointer = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    
    if (focusTarget && !isTransitioning) {
      // Apply focus camera settings (near/far)
      camera.near = CAMERA_FOCUS_CONFIG.near;
      camera.far = CAMERA_FOCUS_CONFIG.far;
      camera.updateProjectionMatrix();
      
      // Smoothly move camera to focused screen position
      easing.damp3(
        state.camera.position as Vector3,
        focusTarget.cameraPosition,
        CAMERA_TRANSITION_CONFIG.positionDamping,
        delta
      );

      // Calculate the target rotation (quaternion) to look at the screen
      const lookAtTarget = new THREE.Vector3(...focusTarget.lookAt);
      const tempCamera = new THREE.PerspectiveCamera();
      tempCamera.position.copy(state.camera.position);
      tempCamera.lookAt(lookAtTarget);

      // Smoothly interpolate the camera's rotation
      state.camera.quaternion.slerp(tempCamera.quaternion, delta * CAMERA_TRANSITION_CONFIG.rotationSpeed);

      // Update previous position and pointer for next frame
      previousPosition.current.copy(state.camera.position);
      previousPointer.current = { x: state.pointer.x, y: state.pointer.y };
    } else if (isTransitioning && focusTarget) {
      // Transition back - animate exactly like zoom-in for symmetry
      const mouseFollowTarget: [number, number, number] = [
        0 + (state.pointer.x * state.viewport.width) / 6,
        (1 + state.pointer.y) / 2,
        5.5,
      ];

      // Smoothly move to mouse-follow position
      easing.damp3(
        state.camera.position as Vector3,
        mouseFollowTarget,
        1.2, // Match normal mode damping for smooth transition
        delta
      );

      // Gradually transition from looking at screen to looking at origin
      const elapsed = transitionStartTime
        ? Date.now() - transitionStartTime
        : 0;
      const transitionProgress = Math.min(elapsed / 2000, 1); // 2 second transition

      // Interpolate lookAt target from screen position to origin
      const screenLookAt = new THREE.Vector3(...focusTarget.lookAt);
      const originLookAt = new THREE.Vector3(0, 0, 0);
      const currentLookAt = screenLookAt.lerp(originLookAt, transitionProgress);

      // Calculate target rotation based on interpolated lookAt
      const targetCamera = new THREE.PerspectiveCamera();
      targetCamera.position.copy(state.camera.position);
      targetCamera.lookAt(currentLookAt);

      // Gradually increase slerp speed over time for smooth blending into normal mode
      const slerpSpeed = 1 + 9 * transitionProgress; // Blend from 1 to 10 (slower start)

      state.camera.quaternion.slerp(
        targetCamera.quaternion,
        delta * slerpSpeed
      );

      // Restore original camera settings when transition completes
      if (elapsed > 2000) {
        camera.near = focusTarget.originalNear;
        camera.far = focusTarget.originalFar;
        camera.updateProjectionMatrix();
        completeClearFocus();
      } else {
        // Smoothly interpolate near/far during transition
        const nearProgress = THREE.MathUtils.lerp(
          CAMERA_FOCUS_CONFIG.near,
          focusTarget.originalNear,
          transitionProgress
        );
        const farProgress = THREE.MathUtils.lerp(
          CAMERA_FOCUS_CONFIG.far,
          focusTarget.originalFar,
          transitionProgress
        );
        camera.near = nearProgress;
        camera.far = farProgress;
        camera.updateProjectionMatrix();
      }

      previousPointer.current = { x: state.pointer.x, y: state.pointer.y };

      // Update previous position for next frame
      previousPosition.current.copy(state.camera.position);
    } else if (mouseFollowEnabled) {
      // Normal mouse-following behavior (only if enabled)
      const target: [number, number, number] = [
        0 + (state.pointer.x * state.viewport.width) / 6,
        (1 + state.pointer.y) / 2,
        5.5,
      ];
      easing.damp3(
        state.camera.position as Vector3,
        target,
        1.2, // Higher damping = slower, gentler movement
        delta
      );

      // Use slerp for smooth rotation to prevent snap when coming from transition
      // Very fast interpolation (delta * 10) makes it nearly instant but smooth
      const targetCamera = new THREE.PerspectiveCamera();
      targetCamera.position.copy(state.camera.position);
      targetCamera.lookAt(0, 0, 0);
      state.camera.quaternion.slerp(targetCamera.quaternion, delta * 10);

      // Update previous position and pointer for next frame
      previousPosition.current.copy(state.camera.position);
      previousPointer.current = { x: state.pointer.x, y: state.pointer.y };
    } else {
      // Update previous position and pointer even when stationary
      previousPosition.current.copy(state.camera.position);
      previousPointer.current = { x: state.pointer.x, y: state.pointer.y };
    }
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && focusTarget && !isTransitioning) {
        clearFocus();
      }
      // Toggle mouse follow with 'M' key
      if (e.key === "m" || e.key === "M") {
        toggleMouseFollow();
        console.log(
          "Mouse follow:",
          !mouseFollowEnabled ? "enabled" : "disabled"
        );
      }
      // Navigate between screens with arrow keys when focused
      if (focusTarget && !isTransitioning) {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          navigateNext();
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          navigatePrevious();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    focusTarget,
    clearFocus,
    isTransitioning,
    toggleMouseFollow,
    mouseFollowEnabled,
    navigateNext,
    navigatePrevious,
  ]);

  return null;
}
