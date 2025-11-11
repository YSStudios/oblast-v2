"use client";

import * as THREE from "three";
import {
  useMemo,
  useContext,
  createContext,
  useRef,
  ReactNode,
  FC,
  useState,
} from "react";
import { useFrame } from "@react-three/fiber";
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

THREE.ColorManagement.enabled = true;

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
  const { nodes } = useGLTF(
    "/models/computers_1-transformed.glb"
  ) as unknown as GLTFResult;
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
      Object46: nodes.Object_207,
      Object47: nodes.Object_215,
      Object48: nodes.Object_216,
      Sphere: nodes.Sphere,
    }),
    [nodes]
  );
  return (
    <Merged castShadow receiveShadow meshes={instances} {...props}>
      {(instances) => (
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
    "/models/computers_1-transformed.glb"
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
      <ScreenInteractive
        frame="Object_206"
        panel="Object_207"
        position={[0.27, 1.53, -2.61]}
        description="Interactive Screen - Click to rotate the cube"
      />
      <ScreenText
        frame="Object_209"
        panel="Object_210"
        y={5}
        position={[-1.43, 2.5, -1.8]}
        rotation={[0, 1, 0]}
        description="Display Monitor - Scrolling text animation"
      />
      <ScreenText
        invert
        frame="Object_212"
        panel="Object_213"
        x={-5}
        y={5}
        position={[-2.73, 0.63, -0.52]}
        rotation={[0, 1.09, 0]}
        description="Terminal Screen - System output display"
      />
      <ScreenText
        invert
        frame="Object_215"
        panel="Object_216"
        position={[1.84, 0.38, -1.77]}
        rotation={[0, -Math.PI / 9, 0]}
        description="Status Monitor - Real-time data visualization"
      />
      <ScreenText
        invert
        frame="Object_218"
        panel="Object_219"
        x={-5}
        position={[3.11, 2.15, -0.18]}
        rotation={[0, -0.79, 0]}
        scale={0.81}
        description="Debug Console - Code execution trace"
      />
      <ScreenText
        frame="Object_221"
        panel="Object_222"
        y={5}
        position={[-3.42, 3.06, 1.3]}
        rotation={[0, 1.22, 0]}
        scale={0.9}
        description="Information Panel - Network statistics"
      />
      <ScreenText
        invert
        frame="Object_224"
        panel="Object_225"
        position={[-3.9, 4.29, -2.64]}
        rotation={[0, 0.54, 0]}
        description="Control Interface - System configuration"
      />
      <ScreenText
        frame="Object_227"
        panel="Object_228"
        position={[0.96, 4.28, -4.2]}
        rotation={[0, -0.65, 0]}
        description="Graphics Display - Rendering viewport"
      />
      <ScreenText
        frame="Object_230"
        panel="Object_231"
        position={[4.68, 4.29, -1.56]}
        rotation={[0, -Math.PI / 3, 0]}
        description="Command Terminal - Input/Output stream"
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
  description?: string;
}

function Screen({
  frame,
  panel,
  children,
  description,
  ...props
}: ScreenProps) {
  const { nodes, materials } = useGLTF(
    "/models/computers_1-transformed.glb"
  ) as unknown as GLTFResult;
  const [hovered, setHovered] = useState(false);
  const textRef = useRef<THREE.Mesh>(null);
  const [displayText, setDisplayText] = useState("");
  const animationProgress = useRef(0);

  // Generate random character
  const randomChar = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    return chars[Math.floor(Math.random() * chars.length)];
  };

  // Animate text reveal
  useFrame((state, delta) => {
    if (hovered && description) {
      animationProgress.current += delta * 1.5; // Speed of animation

      if (animationProgress.current >= 1) {
        setDisplayText(description);
      } else {
        const progress = animationProgress.current;
        const revealedChars = Math.floor(description.length * progress);

        let newText = "";
        for (let i = 0; i < description.length; i++) {
          if (i < revealedChars) {
            newText += description[i];
          } else if (description[i] === " ") {
            newText += " ";
          } else {
            newText += randomChar();
          }
        }
        setDisplayText(newText);
      }
    } else {
      animationProgress.current = 0;
      setDisplayText("");
    }
  });

  // Create rounded rectangle (pill shape) geometry
  const createPillGeometry = (
    width: number,
    height: number,
    radius: number
  ) => {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;

    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    );
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    return new THREE.ShapeGeometry(shape);
  };

  // Calculate text width based on character count (approximate)
  const textWidth = description ? description.length * 0.1 : 0;
  const pillWidth = textWidth + 0.3; // Add padding
  const pillHeight = 0.45;
  const borderRadius = pillHeight / 2; // Full pill shape

  const borderGeometry = useMemo(
    () => createPillGeometry(pillWidth + 0.04, pillHeight + 0.04, borderRadius),
    [pillWidth, pillHeight, borderRadius]
  );
  const backgroundGeometry = useMemo(
    () => createPillGeometry(pillWidth, pillHeight, borderRadius),
    [pillWidth, pillHeight, borderRadius]
  );

  return (
    <group {...props}>
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes[frame] as THREE.Mesh).geometry}
        material={materials.Texture}
      />
      <mesh
        geometry={(nodes[panel] as THREE.Mesh).geometry}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshBasicMaterial toneMapped={false}>
          <RenderTexture width={512} height={512} attach="map" anisotropy={16}>
            {children}
          </RenderTexture>
        </meshBasicMaterial>
      </mesh>

      {hovered && description && (
        <>
          {/* Line connecting top of monitor to label */}
          <Line
            points={[
              [0, 1.2, -0.15],
              [0, 1.8, 0.3],
            ]}
            color="#35c19f"
            lineWidth={4}
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
            position={[0, 1.8, 0.3]}
          >
            {/* Border (pill shape) */}
            <mesh
              position={[0, 0, -0.001]}
              renderOrder={1000}
              geometry={borderGeometry}
            >
              <meshBasicMaterial
                color="#35c19f"
                transparent
                opacity={1}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>

            {/* Background (pill shape) */}
            <mesh
              position={[0, 0, 0]}
              renderOrder={1001}
              geometry={backgroundGeometry}
            >
              <meshBasicMaterial
                color="#000000"
                transparent
                opacity={0.9}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>

            {/* Text */}
            <Text
              ref={textRef}
              position={[0, 0, 0.001]}
              fontSize={0.14}
              color="#35c19f"
              anchorX="center"
              anchorY="middle"
              font="/fonts/Inter-Medium.woff"
              maxWidth={pillWidth - 0.2}
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
  description?: string;
}

function ScreenText({
  invert,
  x = 0,
  y = 1.2,
  description,
  ...props
}: ScreenTextProps) {
  const textRef = useRef<THREE.Mesh>(null);
  const [rand] = useState(() => Math.random() * 10000);
  useFrame((state) => {
    if (textRef.current) {
      textRef.current.position.x =
        x + Math.sin(rand + state.clock.elapsedTime / 4) * 8;
    }
  });
  return (
    <Screen {...props} description={description}>
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
  description?: string;
}

function ScreenInteractive({ description, ...props }: ScreenInteractiveProps) {
  return (
    <Screen {...props} description={description}>
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

interface LedsProps {
  instances: InstancesContextType;
}

function Leds({ instances }: LedsProps) {
  const ref = useRef<THREE.Group>(null);
  const { nodes } = useGLTF(
    "/models/computers_1-transformed.glb"
  ) as unknown as GLTFResult;

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
      ref.current.children.forEach((instance) => {
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
        position={[-0.41, 1.1, -2.21]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[0.59, 1.32, -2.22]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[1.77, 1.91, -1.17]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[2.44, 1.1, -0.79]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[4.87, 3.8, -0.1]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[1.93, 3.8, -3.69]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[-2.35, 3.8, -3.48]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[-4.71, 4.59, -1.81]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[-3.03, 2.85, 1.19]}
        scale={0.005}
        color={[1, 2, 1]}
      />
      <instances.Sphere
        position={[-1.21, 1.73, -1.49]}
        scale={0.005}
        color={[1, 2, 1]}
      />
    </group>
  );
}

useGLTF.preload("/models/computers_1-transformed.glb");
