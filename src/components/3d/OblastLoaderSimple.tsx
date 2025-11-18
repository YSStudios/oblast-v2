'use client';

import { OrthographicCamera, Center, Text3D } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

const OblastText = () => {
  const textRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (textRef.current) {
      // Subtle rotation animation
      textRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <Center>
      <group ref={textRef}>
        <Text3D
          font="/fonts/helvetiker_bold.typeface.json"
          size={0.5}
          height={0.2}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.02}
          bevelSize={0.02}
          bevelOffset={0}
          bevelSegments={5}
        >
          Oblast Studio
          <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.4} />
        </Text3D>
      </group>
    </Center>
  );
};

interface OblastLoaderSimpleProps {
  className?: string;
}

const OblastLoaderSimple = ({ className }: OblastLoaderSimpleProps) => {
  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 50 }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#010101']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, -5]} intensity={10.0} />
          <OblastText />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default OblastLoaderSimple;
