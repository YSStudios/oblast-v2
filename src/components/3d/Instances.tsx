"use client";

import { useMemo, useContext, createContext, type ReactNode } from "react";
import { useGLTF, Merged } from "@react-three/drei";
import type { GLTFResult, InstancesContextType } from "./types";

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

export function useInstances() {
  const instances = useContext(context);
  if (!instances) {
    throw new Error("useInstances must be used within Instances component");
  }
  return instances;
}

