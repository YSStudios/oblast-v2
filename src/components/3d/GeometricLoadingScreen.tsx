"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GeometricLoadingScreenProps {
  scale?: number;
  position?: [number, number, number];
  zoomed?: boolean;
}

export function GeometricLoadingScreen({
  scale = 1,
  position = [0, 0, 0],
  zoomed = false,
}: GeometricLoadingScreenProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Rotate the entire group
      groupRef.current.rotation.y += delta * 0.5;
      groupRef.current.rotation.x += delta * 0.2;
    }

    // Additional rotation for sphere
    if (sphereRef.current) {
      sphereRef.current.rotation.y -= delta * 0.3;
      sphereRef.current.rotation.z += delta * 0.1;
    }

    // Subtle pulsing effect with adjusted scale for zoom
    if (groupRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 1;
      // Use moderately larger scale when zoomed in for sharper rendering
      const effectiveScale = zoomed ? scale * 1 : scale;
      groupRef.current.scale.setScalar(effectiveScale * pulse);
    }
  });

  // Memoize geometries with reduced complexity for performance
  const sphereGeometry = useMemo(
    () => new THREE.SphereGeometry(1, 32, 32),
    []
  );
  const cubeGeometry = useMemo(() => new THREE.BoxGeometry(3, 3, 3), []);

  return (
    <group ref={groupRef} position={position}>
      {/* Wireframe Sphere - Green/Teal with increased resolution */}
      <mesh ref={sphereRef} geometry={sphereGeometry}>
        <meshBasicMaterial
          color="#00ff88"
          wireframe
          transparent
          opacity={0.9}
          wireframeLinewidth={2}
        />
      </mesh>

      {/* Wireframe Cube - Orange/Yellow */}
      <mesh geometry={cubeGeometry}>
        <meshBasicMaterial
          color="#ff8800"
          wireframe
          transparent
          opacity={0.8}
          wireframeLinewidth={2}
        />
      </mesh>

      {/* Additional connecting lines from cube corners to center (reduced for performance) */}
      <group>
        {[
          [-1.5, -1.5, -1.5],
          [1.5, 1.5, 1.5],
          [-1.5, 1.5, -1.5],
          [1.5, -1.5, 1.5],
        ].map((corner, i) => {
          const start = new THREE.Vector3(
            ...(corner as [number, number, number])
          );
          const end = new THREE.Vector3(0, 0, 0);
          const direction = end.clone().sub(start);
          const length = direction.length();
          const tubeGeometry = new THREE.CylinderGeometry(
            0.008,
            0.008,
            length,
            6
          );

          // Position and rotate the tube to connect corner to center
          const midpoint = start.clone().lerp(end, 0.5);
          const quaternion = new THREE.Quaternion();
          quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.normalize()
          );

          return (
            <mesh
              key={i}
              geometry={tubeGeometry}
              position={[midpoint.x, midpoint.y, midpoint.z]}
              quaternion={quaternion}
            >
              <meshBasicMaterial
                color="#ff6600"
                transparent
                opacity={0.6}
              />
            </mesh>
          );
        })}
      </group>

      {/* Central glow effect */}
      <pointLight position={[0, 0, 0]} intensity={1} color="#00ffaa" />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#ff8800" />
    </group>
  );
}
