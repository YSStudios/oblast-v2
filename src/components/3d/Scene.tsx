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
} from "./Computers";
import type { Vector3, BufferGeometry } from "three";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const suzi = import("@pmndrs/assets/models/bunny.glb");

export default function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 1, 5.5], fov: 45, near: 1, far: 20 }}
      eventPrefix="client"
      style={{ width: "100%", height: "100vh" }}
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
        <EffectComposer>
          <Bloom
            luminanceThreshold={0}
            mipmapBlur
            luminanceSmoothing={0.0}
            intensity={3}
          />
          <DepthOfField
            target={[0, 0, 5.5]}
            focalLength={0.05}
            bokehScale={2}
            height={700}
          />
        </EffectComposer>
        <CameraRig />
        <BakeShadows />
      </ScreenFocusProvider>
    </Canvas>
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

function CameraRig() {
  const {
    focusTarget,
    clearFocus,
    completeClearFocus,
    isTransitioning,
    transitionStartTime,
    mouseFollowEnabled,
    toggleMouseFollow,
  } = useScreenFocus();
  const previousPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const previousPointer = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (focusTarget && !isTransitioning) {
      // Smoothly move camera to focused screen position
      easing.damp3(
        state.camera.position as Vector3,
        focusTarget.cameraPosition,
        0.3,
        delta
      );

      // Calculate the target rotation (quaternion) to look at the screen
      const lookAtTarget = new THREE.Vector3(...focusTarget.lookAt);
      const tempCamera = new THREE.PerspectiveCamera();
      tempCamera.position.copy(state.camera.position);
      tempCamera.lookAt(lookAtTarget);

      // Smoothly interpolate the camera's rotation
      state.camera.quaternion.slerp(tempCamera.quaternion, delta * 3);

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

      // Complete transition after rotation speed has ramped up
      if (elapsed > 2000) {
        completeClearFocus();
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
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    focusTarget,
    clearFocus,
    isTransitioning,
    toggleMouseFollow,
    mouseFollowEnabled,
  ]);

  return null;
}
