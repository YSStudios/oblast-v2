import * as THREE from "three";
import type { GLTF } from "three-stdlib";
import type { ReactNode, FC } from "react";

export type GLTFResult = GLTF & {
  nodes: Record<string, THREE.Object3D>;
  materials: Record<string, THREE.Material>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InstancesContextType = Record<string, FC<any>>;

export interface FocusTarget {
  cameraPosition: [number, number, number];
  lookAt: [number, number, number];
  originalPosition: [number, number, number];
  originalQuaternion: [number, number, number, number];
  originalNear: number;
  originalFar: number;
}

export interface ScreenRegistration {
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

export interface ScreenProps {
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
  zoomDistanceMultiplier?: number;
}

export interface ScreenTextProps {
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

export interface ScreenInteractiveProps {
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
  zoomDistanceMultiplier?: number;
}

export interface ScreenVideoProps {
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

export interface LedsProps {
  instances: InstancesContextType;
}

export interface ComputersProps {
  scale?: number;
}

