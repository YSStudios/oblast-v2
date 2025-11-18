"use client";

import * as THREE from "three";
import {
  useMemo,
  useContext,
  createContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type FC,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  useGLTF,
  Merged,
  RenderTexture,
  PerspectiveCamera,
  Text,
  Billboard,
  Line,
} from "@react-three/drei";
import { SpinningBox } from "./SpinningBox";
import type { GLTF } from "three-stdlib";
import Hls, { type ErrorData } from "hls.js";

THREE.ColorManagement.enabled = true;

// Camera focus configuration - adjust these values to change how the camera behaves when focusing on screens
export const CAMERA_FOCUS_CONFIG = {
  // Distance multiplier: how far back the camera sits from the screen
  // Higher = farther away (more context visible), Lower = closer (screen fills more of view)
  distanceMultiplier: 3,

  // Field of view in degrees (should match the main camera FOV in Scene.tsx)
  // Higher = wider view, Lower = tighter view
  fov: 60,

  // Near clipping plane: how close objects can be before being clipped
  // Lower = can see objects closer to camera (e.g., 0.1), Higher = objects closer than this are clipped (e.g., 0.5)
  near: 0.1,

  // Far clipping plane: how far objects can be before being clipped
  // Higher = can see objects farther away (e.g., 50), Lower = objects farther than this are clipped (e.g., 20)
  far: 50,
} as const;

// Context for managing screen focus state
interface FocusTarget {
  cameraPosition: [number, number, number];
  lookAt: [number, number, number];
  originalPosition: [number, number, number];
  originalQuaternion: [number, number, number, number];
  originalNear: number;
  originalFar: number;
}

interface ScreenRegistration {
  id: string;
  handleClick: () => void;
  ref: React.RefObject<THREE.Mesh | null> | null;
  name?: string;
  description?: string;
  descriptionOffset?: {
    forward?: number;
    up?: number;
    textY?: number;
  };
}

interface ScreenFocusContextType {
  focusTarget: FocusTarget | null;
  setFocusTarget: (target: FocusTarget) => void;
  clearFocus: () => void;
  completeClearFocus: () => void;
  isTransitioning: boolean;
  transitionStartTime: number | null;
  zoomInComplete: boolean;
  setZoomInComplete: (complete: boolean) => void;
  mouseFollowEnabled: boolean;
  toggleMouseFollow: () => void;
  registerScreen: (
    id: string,
    handleClick: () => void,
    ref: React.RefObject<THREE.Mesh | null> | null,
    name?: string,
    description?: string,
    descriptionOffset?: {
      forward?: number;
      up?: number;
      textY?: number;
    }
  ) => void;
  unregisterScreen: (id: string) => void;
  currentScreenId: string | null;
  setCurrentScreenId: (id: string) => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
  screens: ScreenRegistration[];
}

const ScreenFocusContext = createContext<ScreenFocusContextType | null>(null);

export function ScreenFocusProvider({ children }: { children: ReactNode }) {
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionStartTime, setTransitionStartTime] = useState<number | null>(
    null
  );
  const [zoomInComplete, setZoomInComplete] = useState(false);
  const [mouseFollowEnabled, setMouseFollowEnabled] = useState(true);
  const [screens, setScreens] = useState<ScreenRegistration[]>([]);
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);

  const registerScreen = useCallback(
    (
      id: string,
      handleClick: () => void,
      ref: React.RefObject<THREE.Mesh | null> | null,
      name?: string,
      description?: string,
      descriptionOffset?: {
        forward?: number;
        up?: number;
        textY?: number;
      }
    ) => {
      setScreens((prev: ScreenRegistration[]) => {
        // Prevent duplicates
        if (prev.find((s: ScreenRegistration) => s.id === id)) return prev;
        return [
          ...prev,
          { id, handleClick, ref, name, description, descriptionOffset },
        ];
      });
    },
    []
  );

  const unregisterScreen = useCallback((id: string) => {
    setScreens((prev: ScreenRegistration[]) =>
      prev.filter((s: ScreenRegistration) => s.id !== id)
    );
  }, []);

  const navigateNext = useCallback(() => {
    if (!currentScreenId || screens.length === 0) return;
    const currentIndex = screens.findIndex(
      (s: ScreenRegistration) => s.id === currentScreenId
    );
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % screens.length;
    screens[nextIndex].handleClick();
  }, [currentScreenId, screens]);

  const navigatePrevious = useCallback(() => {
    if (!currentScreenId || screens.length === 0) return;
    const currentIndex = screens.findIndex(
      (s: ScreenRegistration) => s.id === currentScreenId
    );
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + screens.length) % screens.length;
    screens[prevIndex].handleClick();
  }, [currentScreenId, screens]);

  const clearFocus = useCallback(() => {
    setIsTransitioning(true);
    setTransitionStartTime(Date.now());
    setZoomInComplete(false); // Immediately hide text when zoom out starts
    // Don't clear focus target immediately - let the transition complete
  }, []);

  const handleSetFocus = useCallback((target: FocusTarget) => {
    setIsTransitioning(false);
    setTransitionStartTime(null);
    setZoomInComplete(false); // Reset when starting new zoom
    setFocusTarget(target);
    // Dispatch event for UI
    window.dispatchEvent(
      new CustomEvent("screenFocusChange", { detail: { focused: true } })
    );
  }, []);

  const completeClearFocus = useCallback(() => {
    setFocusTarget(null);
    setIsTransitioning(false);
    setTransitionStartTime(null);
    setZoomInComplete(false);
    setCurrentScreenId(null);
    // Dispatch event for UI
    window.dispatchEvent(
      new CustomEvent("screenFocusChange", { detail: { focused: false } })
    );
  }, []);

  const toggleMouseFollow = useCallback(() => {
    setMouseFollowEnabled((prev: boolean) => !prev);
  }, []);

  return (
    <ScreenFocusContext.Provider
      value={{
        focusTarget,
        setFocusTarget: handleSetFocus,
        clearFocus,
        completeClearFocus,
        isTransitioning,
        transitionStartTime,
        zoomInComplete,
        setZoomInComplete,
        mouseFollowEnabled,
        toggleMouseFollow,
        registerScreen,
        unregisterScreen,
        currentScreenId,
        setCurrentScreenId,
        navigateNext,
        navigatePrevious,
        screens,
      }}
    >
      {children}
    </ScreenFocusContext.Provider>
  );
}

export function useScreenFocus() {
  const context = useContext(ScreenFocusContext);
  if (!context) {
    throw new Error("useScreenFocus must be used within ScreenFocusProvider");
  }
  return context;
}

type GLTFResult = GLTF & {
  nodes: Record<string, THREE.Object3D>;
  materials: Record<string, THREE.Material>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InstancesContextType = Record<string, FC<any>>;

const context = createContext<InstancesContextType | null>(null);

interface InstancesProps {
  children: ReactNode;
}

export function Instances({ children, ...props }: InstancesProps) {
  const { nodes } = useGLTF("/models/computers_2.glb") as unknown as GLTFResult;
  const instances = useMemo(
    () => ({
      Object: nodes.Object_4,
      Object1: nodes.Object_16,
      Object3: nodes.Object_52,
      Object13: nodes.Object_172,
      Object14: nodes.Object_174,
      Object23: nodes.Object_22,
      Object24: nodes.Object_26,
      Object32: nodes.Object_178,
      Object36: nodes.Object_28,
      Object45: nodes.Object_206,
      Object47: nodes.Object_215,
      Sphere: nodes.Sphere,
    }),
    [nodes]
  );
  return (
    <Merged castShadow receiveShadow meshes={instances} {...props}>
      {(instances: InstancesContextType) => (
        <context.Provider value={instances as InstancesContextType}>
          {children}
        </context.Provider>
      )}
    </Merged>
  );
}

interface ComputersProps {
  scale?: number;
}

export function Computers(props: ComputersProps) {
  const { nodes: n, materials: m } = useGLTF(
    "/models/computers_2.glb"
  ) as unknown as GLTFResult;
  const instances = useContext(context);

  if (!instances) return null;

  return (
    <group {...props} dispose={null}>
      <instances.Object
        position={[0.16, 0.79, -1.97]}
        rotation={[-0.54, 0.93, -1.12]}
        scale={0.5}
      />
      <instances.Object
        position={[-2.79, 0.27, 1.82]}
        rotation={[-1.44, 1.22, 1.43]}
        scale={0.5}
      />
      <instances.Object
        position={[-5.6, 4.62, -0.03]}
        rotation={[-1.96, 0.16, 1.2]}
        scale={0.5}
      />
      <instances.Object
        position={[2.62, 1.98, -2.47]}
        rotation={[-0.42, -0.7, -1.85]}
        scale={0.5}
      />
      <instances.Object
        position={[4.6, 3.46, 1.19]}
        rotation={[-1.24, -0.72, 0.48]}
        scale={0.5}
      />
      <instances.Object1
        position={[0.63, 0, -3]}
        rotation={[0, 0.17, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[-2.36, 0.32, -2.02]}
        rotation={[0, 0.53, -Math.PI / 2]}
        scale={1.52}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_24 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[-2.42, 0.94, -2.25]}
        rotation={[0, 0.14, Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object1
        position={[-3.53, 0, 0.59]}
        rotation={[Math.PI, -1.09, Math.PI]}
        scale={1.52}
      />
      <instances.Object1
        position={[-3.53, 1.53, 0.59]}
        rotation={[0, 0.91, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[3.42, 0, 0]}
        rotation={[-Math.PI, 1.13, -Math.PI]}
        scale={1.52}
      />
      <instances.Object1
        position={[4.09, 2.18, 2.41]}
        rotation={[0, -1.55, 1.57]}
        scale={1.52}
      />
      <instances.Object3
        position={[4.31, 1.57, 2.34]}
        rotation={[0, -1.15, -Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object3
        position={[-3.79, 0, 1.66]}
        rotation={[Math.PI, -1.39, 0]}
        scale={-1.52}
      />
      <instances.Object3
        position={[-3.79, 1.53, 1.66]}
        rotation={[0, 1.22, -Math.PI]}
        scale={-1.52}
      />
      <instances.Object1
        position={[-3.69, 0, 2.59]}
        rotation={[0, -1.57, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[-5.36, 2.18, 0.81]}
        rotation={[0, 0.77, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object3
        position={[-5.56, 1.57, 0.69]}
        rotation={[0, 1.17, -Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object1
        position={[-5.47, 2.79, 0.74]}
        rotation={[Math.PI, -1.16, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object3
        position={[-5.29, 3.41, 0.89]}
        rotation={[Math.PI, -0.76, -Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object1
        position={[-5.28, 0, -2.33]}
        rotation={[0, 0.75, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[-5.49, 0, -1.38]}
        rotation={[Math.PI, -0.99, Math.PI]}
        scale={1.52}
      />
      <instances.Object1
        position={[-3.01, 0, -3.79]}
        rotation={[0, 0.6, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[-2.08, 0, -4.32]}
        rotation={[Math.PI, -0.6, Math.PI]}
        scale={1.52}
      />
      <instances.Object1
        position={[-1.02, 0, -4.49]}
        rotation={[0, 0.31, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[-5.31, 1.83, -1.41]}
        rotation={[0, 1.06, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object1
        position={[-4.18, 1.83, -3.06]}
        rotation={[-Math.PI, -0.46, -Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object1
        position={[-1.76, 1.83, -3.6]}
        rotation={[0, -1.16, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object1
        position={[-0.25, 1.83, -5.54]}
        rotation={[0, 1.55, 1.57]}
        scale={1.52}
      />
      <instances.Object1
        position={[-5.28, 2.14, -2.33]}
        rotation={[Math.PI, -0.75, Math.PI]}
        scale={1.52}
      />
      <instances.Object1
        position={[-5.49, 2.14, -1.38]}
        rotation={[0, 0.99, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[-3.01, 2.14, -3.79]}
        rotation={[Math.PI, -0.6, Math.PI]}
        scale={1.52}
      />
      <instances.Object1
        position={[-2.08, 2.14, -4.32]}
        rotation={[0, 0.6, 0]}
        scale={1.52}
      />
      <instances.Object1
        position={[-1.02, 2.14, -4.49]}
        rotation={[Math.PI, -0.31, Math.PI]}
        scale={1.52}
      />
      <instances.Object1
        position={[-5.31, 3.98, -1.41]}
        rotation={[0, 1.06, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object1
        position={[-4.18, 3.98, -3.06]}
        rotation={[-Math.PI, -0.46, -Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object1
        position={[-1.17, 3.98, -4.45]}
        rotation={[0, 0.17, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object1
        position={[-0.94, 3.98, -4.66]}
        rotation={[Math.PI, 0.02, -Math.PI / 2]}
        scale={1.52}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_140 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[5.53, 2.18, 0.17]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_144 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[5.74, 1.57, 0.05]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_148 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[5.65, 2.79, 0.11]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_152 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[5.46, 3.41, 0.26]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_156 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[4.86, 0, -2.54]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_160 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[5.06, 0, -1.6]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_164 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[2.59, 0, -4]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_168 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[1.66, 0, -4.54]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_170 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[0.59, 0, -4.7]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <instances.Object13
        position={[4.89, 1.83, -1.62]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <instances.Object14
        position={[3.75, 1.83, -3.28]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_176 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[1.33, 1.83, -3.82]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_180 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[4.86, 2.14, -2.54]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_184 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[5.06, 2.14, -1.6]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_188 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[2.59, 2.14, -4]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_192 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[1.66, 2.14, -4.54]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_194 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[0.59, 2.14, -4.7]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <instances.Object13
        position={[4.89, 3.98, -1.62]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <instances.Object14
        position={[3.75, 3.98, -3.28]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_200 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[0.75, 3.98, -4.66]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_18 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[-0.19, 0, -2.96]}
        rotation={[0, -0.06, 0]}
        scale={1.52}
      />
      <instances.Object23
        position={[-2.29, 1.56, -2.26]}
        rotation={[0, -0.005, -Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object24
        position={[-2.19, 2.19, -1.87]}
        rotation={[0, 0.51, Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object23
        position={[-2.9, 0.3, -1.47]}
        rotation={[Math.PI, -1.35, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object23
        position={[3.22, 0, -0.8]}
        rotation={[0, -1.32, 0]}
        scale={1.52}
      />
      <instances.Object23
        position={[3.53, 1.83, 0.44]}
        rotation={[-Math.PI, 1.32, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object23
        position={[4.26, 0.94, 2.22]}
        rotation={[0, -1, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object24
        position={[3.87, 0.32, 2.35]}
        rotation={[0, -1.53, -1.57]}
        scale={-1.52}
      />
      <instances.Object23
        position={[-5.61, 0.94, 0.82]}
        rotation={[0, 1.32, 1.57]}
        scale={1.52}
      />
      <instances.Object24
        position={[-5.26, 0.32, 1.01]}
        rotation={[0, 0.79, -Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object23
        position={[-5.39, 4.03, 0.99]}
        rotation={[Math.PI, -0.61, Math.PI / 2]}
        scale={1.52}
      />
      <instances.Object24
        position={[-5.7, 4.66, 0.72]}
        rotation={[Math.PI, -1.13, -Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object23
        position={[-5.95, 0, -0.64]}
        rotation={[0, 0.95, 0]}
        scale={1.52}
      />
      <instances.Object23
        position={[-4.48, 0, -2.75]}
        rotation={[Math.PI, -0.57, Math.PI]}
        scale={1.52}
      />
      <instances.Object23
        position={[-3.72, 0, -2.89]}
        rotation={[0, 0.64, 0]}
        scale={1.52}
      />
      <instances.Object23
        position={[-0.08, 0, -5.03]}
        rotation={[Math.PI, -0.04, Math.PI]}
        scale={1.52}
      />
      <instances.Object24
        position={[-4.19, 1.84, -2.77]}
        rotation={[Math.PI, -0.66, -Math.PI / 2]}
        scale={-1.52}
      />
      <instances.Object23
        position={[-5.95, 2.14, -0.64]}
        rotation={[Math.PI, -0.95, Math.PI]}
        scale={1.52}
      />
      <instances.Object23
        position={[-4.48, 2.14, -2.75]}
        rotation={[0, 0.57, 0]}
        scale={1.52}
      />
      <instances.Object23
        position={[-3.73, 2.14, -3.1]}
        rotation={[Math.PI, -0.64, Math.PI]}
        scale={1.52}
      />
      <instances.Object23
        position={[-0.08, 2.14, -5.03]}
        rotation={[0, 0.04, 0]}
        scale={1.52}
      />
      <instances.Object24
        position={[-4.19, 3.98, -2.77]}
        rotation={[Math.PI, -0.66, -Math.PI / 2]}
        scale={-1.52}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_142 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[5.79, 0.94, 0.18]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_146 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[5.43, 0.32, 0.37]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_150 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[5.56, 4.03, 0.35]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_154 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[5.87, 4.66, 0.08]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_158 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[5.53, 0, -0.85]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_162 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[4.05, 0, -2.96]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_166 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[3.29, 0, -3.1]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <instances.Object32
        position={[3.77, 1.84, -2.98]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_182 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[5.53, 2.14, -0.85]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_186 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[4.05, 2.14, -2.96]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_190 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[3.3, 2.14, -3.31]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <instances.Object32
        position={[3.77, 3.98, -2.98]}
        rotation={[-Math.PI, 0, 0]}
        scale={-1}
      />
      <instances.Object36
        position={[0.35, 2.35, -3.34]}
        rotation={[-0.26, 0, 0]}
      />
      <instances.Object36
        position={[0.18, 2.8, -2.85]}
        rotation={[0.09, 0.15, -0.005]}
      />
      <instances.Object36
        position={[1.89, 0, -1.94]}
        rotation={[0, -0.44, 0]}
        scale={[1.5, 1, 1.5]}
      />
      <instances.Object36
        position={[1.86, 1.61, -1.81]}
        rotation={[0, -Math.PI / 3, 0]}
      />
      <instances.Object36
        position={[3.95, 2.49, 1.61]}
        rotation={[0, -Math.PI / 3, 0]}
      />
      <instances.Object36
        position={[-1.1, 4.29, -4.43]}
        rotation={[0, 0.36, 0]}
      />
      <instances.Object36
        position={[-5.25, 4.29, -1.47]}
        rotation={[0, 1.25, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(n.Object_204 as THREE.Mesh).geometry}
        material={m.Texture}
        position={[3.2, 4.29, -3.09]}
        rotation={[-Math.PI, 0.56, 0]}
        scale={-1}
      />
      {/* LCDScreen (no number) - Video 1 */}
      <ScreenVideo
        frame="Object_212"
        panel="LCDScreen"
        position={[-2.73, 0.63, -0.52]}
        rotation={[0, 1.09, 0]}
        name="<< Terminal Screen >>"
        description="Terminal Screen - System output display"
        muxPlaybackId="NRXAS23NDPmK6OdqD5GZ6zngNl8aIPXGbeX1ObtkNnM"
      />

      {/* LCDScreen001 - Video 2 */}
      <ScreenVideo
        frame="Object_209"
        panel="LCDScreen001"
        position={[-1.43, 2.5, -1.8]}
        rotation={[0, 1, 0]}
        name="<< Display Monitor >>"
        description="Display Monitor - Video playback"
        muxPlaybackId="UchQ5kkYx4IYw4U3Tvqvx5adzlydwWPP61TpajFDl01Y"
      />

      {/* LCDScreen002 */}
      <ScreenText
        frame="Object_221"
        panel="LCDScreen002"
        y={5}
        position={[-3.42, 3.06, 1.3]}
        rotation={[0, 1.22, 0]}
        scale={0.9}
        name="<< Information Panel >>"
        description="Network statistics - monitoring with bandwidth usage and connection details. View all active connections and data transfer rates."
        descriptionOffset={{
          forward: 0.1,
          up: 0.65,
          textY: 0.7,
        }}
      />

      {/* LCDScreen003 - Interactive Spinning Cube */}
      <ScreenInteractive
        frame="Object_206"
        panel="LCDScreen003"
        position={[0.27, 1.53, -2.61]}
        name="<< Interactive Screen >>"
        description="3D Visualization System - Click to rotate the animated cube object and explore the interactive 3D space with real-time rendering."
        descriptionOffset={{
          forward: 0.65,
          up: 0.65,
          textY: 0.7,
        }}
      />

      {/* LCDScreen004 - Video 3 */}
      <ScreenVideo
        frame="Object_218"
        panel="LCDScreen004"
        position={[3.11, 2.15, -0.18]}
        rotation={[0, -0.79, 0]}
        scale={0.81}
        name="<< Video Display >>"
        description="Debug Console - screen module debug website link >>>>>"
        muxPlaybackId="V01ic01DGkzDBvjPN4eOw17NPBEeQQRSRVF1SOr1JPPM8"
        descriptionOffset={{
          forward: 0.3,
          up: 0.51,
          textY: 0.7,
        }}
      />

      {/* LCDScreen005 */}
      <ScreenText
        invert
        frame="Object_215"
        panel="LCDScreen005"
        position={[1.84, 0.38, -1.77]}
        rotation={[0, -Math.PI / 9, 0]}
        name="<< Status Monitor >>"
        description="Real-time performance - metrics and data visualization dashboard. Monitor CPU, memory, network usage and system health indicators."
        descriptionOffset={{
          forward: 0.5,
          up: 0.58,
          textY: 0.7,
        }}
      />

      {/* LCDScreen006 */}
      <ScreenText
        invert
        frame="Object_224"
        panel="LCDScreen006"
        position={[-3.9, 4.29, -2.64]}
        rotation={[0, 0.54, 0]}
        name="<< Control Interface >>"
        description="System configuration - panel with advanced settings and preferences. Customize your workspace and adjust system parameters."
        descriptionOffset={{
          forward: 0.4,
          up: 0.58,
          textY: 0.7,
        }}
      />

      {/* LCDScreen007 */}
      <ScreenText
        frame="Object_227"
        panel="LCDScreen007"
        position={[0.96, 4.28, -4.2]}
        rotation={[0, -0.65, 0]}
        name="<< Graphics Display >>"
        description="3D rendering - viewport with shader preview and material editor. Create and test visual effects with real-time feedback."
        descriptionOffset={{
          forward: 0.65,
          up: 0.58,
          textY: 0.7,
        }}
      />

      {/* LCDScreen008 */}
      <ScreenText
        frame="Object_230"
        panel="LCDScreen008"
        position={[4.68, 4.29, -1.56]}
        rotation={[0, -Math.PI / 3, 0]}
        name="<< Command Terminal >>"
        description="Interactive - input and output stream with command history. Execute commands and view results with persistent session history."
        labelYOffset={0.8}
        descriptionOffset={{
          forward: 0.3,
          up: 0.68,
          textY: 0.7,
        }}
      />

      <Leds instances={instances} />
    </group>
  );
}

interface ScreenProps {
  frame: string;
  panel: string;
  children: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  name?: string;
  description?: string;
  labelYOffset?: number;
  descriptionOffset?: {
    forward?: number;
    up?: number;
    textY?: number;
  };
}

function Screen({
  frame,
  panel,
  children,
  name,
  description,
  labelYOffset: customLabelYOffset,
  descriptionOffset,
  ...props
}: ScreenProps) {
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
    clearFocus,
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
      CAMERA_FOCUS_CONFIG.distanceMultiplier;

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
    clearFocus,
    camera,
    isTransitioning,
    screenId,
    currentScreenId,
    setCurrentScreenId,
  ]);

  // Register this screen on mount, unregister on unmount
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
            width={isFocused ? 512 : 256}
            height={isFocused ? 512 : 256}
            attach="map"
            anisotropy={isFocused ? 16 : 8}
            frames={Infinity}
          >
            {children}
          </RenderTexture>
        </meshBasicMaterial>
      </mesh>

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

interface ScreenTextProps {
  invert?: boolean;
  x?: number;
  y?: number;
  frame: string;
  panel: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  name?: string;
  description?: string;
  labelYOffset?: number;
  descriptionOffset?: {
    forward?: number;
    up?: number;
    textY?: number;
  };
}

function ScreenText({
  invert,
  x = 0,
  y = 1.2,
  name,
  description,
  labelYOffset,
  descriptionOffset,
  ...props
}: ScreenTextProps) {
  const textRef = useRef<THREE.Mesh>(null);
  const [rand] = useState(() => Math.random() * 10000);
  useFrame((state) => {
    if (textRef.current) {
      textRef.current.position.x =
        x + Math.sin(rand + state.clock.elapsedTime / 4) * 3.3;
    }
  });
  return (
    <Screen
      {...props}
      name={name}
      description={description}
      labelYOffset={labelYOffset}
      descriptionOffset={descriptionOffset}
    >
      <PerspectiveCamera
        makeDefault
        manual
        aspect={1 / 1}
        position={[0, 0, 15]}
      />
      <color attach="background" args={[invert ? "black" : "#35c19f"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <Text
        font="/fonts/Inter-Medium.woff"
        position={[x, y, 0]}
        ref={textRef}
        fontSize={4}
        letterSpacing={-0.1}
        color={!invert ? "black" : "#35c19f"}
      >
        Oblast
      </Text>
    </Screen>
  );
}

interface ScreenInteractiveProps {
  frame: string;
  panel: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  name?: string;
  description?: string;
  labelYOffset?: number;
  descriptionOffset?: {
    forward?: number;
    up?: number;
    textY?: number;
  };
}

function ScreenInteractive({
  name,
  description,
  labelYOffset,
  descriptionOffset,
  ...props
}: ScreenInteractiveProps) {
  return (
    <Screen
      {...props}
      name={name}
      description={description}
      labelYOffset={labelYOffset}
      descriptionOffset={descriptionOffset}
    >
      <PerspectiveCamera
        makeDefault
        manual
        aspect={1 / 1}
        position={[0, 0, 10]}
      />
      <color attach="background" args={["orange"]} />
      <ambientLight intensity={Math.PI / 2} />
      <pointLight decay={0} position={[10, 10, 10]} intensity={Math.PI} />
      <pointLight decay={0} position={[-10, -10, -10]} />
      <SpinningBox position={[-3.15, 0.75, 0]} scale={0.5} />
    </Screen>
  );
}

interface ScreenVideoProps {
  frame: string;
  panel: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  name?: string;
  description?: string;
  labelYOffset?: number;
  descriptionOffset?: {
    forward?: number;
    up?: number;
    textY?: number;
  };
  muxPlaybackId: string;
}

function ScreenVideo({
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
        // Only log if we have actual error data (suppress empty error objects)
        const hasErrorData =
          data.type !== undefined ||
          data.details !== undefined ||
          data.fatal !== undefined ||
          (data.error !== undefined && data.error !== null);

        if (hasErrorData && (data.type || data.details || data.fatal || data.error)) {
          console.error("HLS error:", {
            type: data.type,
            details: data.details,
            fatal: data.fatal,
            error: data.error,
            muxPlaybackId,
          });
        }

        if (data.fatal) {
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

interface LedsProps {
  instances: InstancesContextType;
}

function Leds({ instances }: LedsProps) {
  const ref = useRef<THREE.Group>(null);
  const { nodes } = useGLTF("/models/computers_2.glb") as unknown as GLTFResult;

  useMemo(() => {
    const sphere = nodes.Sphere as THREE.Mesh;
    if (sphere.material) {
      const material = new THREE.MeshBasicMaterial();
      material.toneMapped = false;
      // eslint-disable-next-line react-hooks/immutability
      sphere.material = material;
    }
  }, [nodes.Sphere]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((instance: THREE.Object3D) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const instanceWithColor = instance as any;
        if (instanceWithColor.color) {
          const rand = Math.abs(2 + instance.position.x);
          const t = Math.round(
            (1 + Math.sin(rand * 10000 + state.clock.elapsedTime * rand)) / 2
          );
          instanceWithColor.color.setRGB(0, t * 1.1, t);
        }
      });
    }
  });
  return (
    <group ref={ref}>
      <instances.Sphere
        position={[-0.408, 1.095, -2.212]}
        scale={0.009}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[0.588, 1.323, -2.222]}
        scale={0.009}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[1.772, 1.909, -1.165]}
        scale={0.009}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[2.438, 1.096, -0.786]}
        scale={0.009}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[4.868, 3.799, -0.097]}
        scale={0.009}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[1.93, 3.795, -3.69]}
        scale={0.009}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[-2.346, 3.799, -3.479]}
        scale={0.009}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[-4.706, 4.589, -1.812]}
        scale={0.009}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[-3.032, 2.853, 1.195]}
        scale={0.009}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[-1.206, 1.731, -1.489]}
        scale={0.009}
        color={[1, 2, 1]}
      />
    </group>
  );
}

useGLTF.preload("/models/computers_2.glb");
