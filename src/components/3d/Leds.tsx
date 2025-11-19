"use client";

import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { LedsProps, GLTFResult } from "./types";

export function Leds({ instances }: LedsProps) {
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

