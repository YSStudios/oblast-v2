"use client";

import { useRef, useEffect, useMemo, useState } from 'react';
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const DistortionShaderMaterial = shaderMaterial(
  {
    uTexture: null,
    uDistortionTexture: null,
    uDistortionStrength: 0.02,
    uTime: 0,
  },
  // Vertex shader
  `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform sampler2D uTexture;
    uniform sampler2D uDistortionTexture;
    uniform float uDistortionStrength;
    uniform float uTime;

    varying vec2 vUv;

    void main() {
      // Sample distortion
      vec4 distortion = texture2D(uDistortionTexture, vUv);

      // Apply distortion to UV
      vec2 distortedUv = vUv + distortion.rg * uDistortionStrength;

      // Clamp UV
      distortedUv = clamp(distortedUv, 0.0, 1.0);

      // Sample main texture
      vec4 color = texture2D(uTexture, distortedUv);

      gl_FragColor = color;
    }
  `
);

extend({ DistortionShaderMaterial });

interface DistortedScreenMaterialProps {
  texture: THREE.Texture | null;
  grid?: number;
  mouse?: number;
  strength?: number;
  relaxation?: number;
  distortionStrength?: number;
}

export function DistortedScreenMaterial({
  texture: _texture,
  grid = 40,
  mouse = 0.3,
  strength = 2.0,
  relaxation = 0.75,
  distortionStrength = 0.02,
}: DistortedScreenMaterialProps) {
  const materialRef = useRef<any>(null);
  const mouseStateRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 });
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // Create distortion texture
  const distortionTexture = useMemo(() => {
    const size = grid;
    const data = new Float32Array(4 * size * size);

    for (let i = 0; i < size * size; i++) {
      data[i * 4] = 0;
      data[i * 4 + 1] = 0;
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 1;
    }

    const texture = new THREE.DataTexture(
      data,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    texture.needsUpdate = true;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;

    return texture;
  }, [grid]);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = 1 - e.clientY / window.innerHeight;
      const mouseState = mouseStateRef.current;

      mouseState.vX = x - mouseState.prevX;
      mouseState.vY = y - mouseState.prevY;
      mouseState.x = x;
      mouseState.y = y;
      mouseState.prevX = x;
      mouseState.prevY = y;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Get the texture from the parent mesh
  useFrame((state, delta) => {
    if (!materialRef.current) return;

    // Get the RenderTexture from the parent mesh
    if (!texture && materialRef.current.__r3f?.parent) {
      const parentMesh = materialRef.current.__r3f.parent;
      if (parentMesh.material && 'map' in parentMesh.material) {
        const map = parentMesh.material.map;
        if (map) {
          setTexture(map);
          materialRef.current.uTexture = map;
        }
      }
    }

    const data = distortionTexture.image.data;
    const gridSize = grid;
    const mouseState = mouseStateRef.current;
    const threshold = 1.0;

    // Apply relaxation
    for (let i = 0; i < gridSize * gridSize; i++) {
      data[i * 4] *= relaxation;
      data[i * 4 + 1] *= relaxation;

      // Zero out small values
      if (Math.abs(data[i * 4]) < threshold) data[i * 4] = 0;
      if (Math.abs(data[i * 4 + 1]) < threshold) data[i * 4 + 1] = 0;
    }

    // Apply mouse distortion
    const gridMouseX = gridSize * mouseState.x;
    const gridMouseY = gridSize * mouseState.y;
    const maxDist = gridSize * mouse;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const distSq = Math.pow(gridMouseX - i, 2) + Math.pow(gridMouseY - j, 2);
        if (distSq < maxDist * maxDist) {
          const index = 4 * (i + gridSize * j);
          const power = Math.min(maxDist / Math.sqrt(distSq), 10);
          data[index] += strength * 100 * mouseState.vX * power;
          data[index + 1] -= strength * 100 * mouseState.vY * power;
        }
      }
    }

    distortionTexture.needsUpdate = true;
    materialRef.current.uTime = state.clock.elapsedTime;
  });

  return (
    <distortionShaderMaterial
      ref={materialRef}
      uTexture={texture || undefined}
      uDistortionTexture={distortionTexture}
      uDistortionStrength={distortionStrength}
      toneMapped={false}
      attach="material"
    />
  );
}
