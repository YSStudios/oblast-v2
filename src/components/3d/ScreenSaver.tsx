"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

export function ScreenSaver() {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Animate background mesh with wave effect
    if (meshRef.current && (meshRef.current.material as THREE.ShaderMaterial).uniforms) {
      (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
    }
    
    // Gentle floating animation for text
    if (textRef.current) {
      textRef.current.position.y = Math.sin(time * 0.5) * 0.3;
    }
    
    // Rotate the ring slowly
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.2;
    }
  });

  return (
    <group position={[-11, 1, -5]}>
      {/* Animated background with shader */}
      <mesh ref={meshRef} position={[0, 0, -8]}>
        <planeGeometry args={[20, 20]} />
        <shaderMaterial
          uniforms={{
            uTime: { value: 0 },
            uColor1: { value: new THREE.Color(0x4a90e2) },
            uColor2: { value: new THREE.Color(0x7b68ee) },
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uTime;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            varying vec2 vUv;
            
            void main() {
              vec2 uv = vUv;
              
              // Create wave pattern
              float wave1 = sin(uv.x * 8.0 + uTime * 0.8) * 0.5 + 0.5;
              float wave2 = sin(uv.y * 8.0 - uTime * 0.6) * 0.5 + 0.5;
              float wave = (wave1 + wave2) * 0.5;
              
              // Create circular gradient from center
              vec2 center = vec2(0.5, 0.5);
              float dist = distance(uv, center);
              float gradient = 1.0 - smoothstep(0.0, 0.8, dist);
              
              // Mix colors with wave
              vec3 color = mix(uColor1, uColor2, wave);
              
              // Apply gradient and boost brightness
              color = color * gradient * 1.5;
              
              gl_FragColor = vec4(color, 1.0);
            }
          `}
        />
      </mesh>

      {/* "MENU" text */}
      <Text
        ref={textRef}
        position={[0, 0, 0]}
        fontSize={2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Medium.woff"
        letterSpacing={0.1}
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        MENU
      </Text>

      {/* Rotating ring decoration */}
      <mesh ref={ringRef} position={[0, 0, -0.5]}>
        <torusGeometry args={[4, 0.15, 16, 100]} />
        <meshBasicMaterial color="#35c19f" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

