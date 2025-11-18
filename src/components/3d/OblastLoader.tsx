'use client';

import { OrthographicCamera, Center, Text3D } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';

const LEDEffect = dynamic(
  () => import('./LEDEffect').then((mod) => ({ default: mod.LEDEffect })),
  { ssr: false }
);

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

const LEDScene = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, 0, 5]}
        zoom={100}
        near={0.01}
        far={500}
      />
      <OblastText />
      {mounted && <LEDEffect pixelSize={8.0} maskStagger={0.5} />}
    </>
  );
};

interface OblastLoaderProps {
  className?: string;
}

const OblastLoader = ({ className }: OblastLoaderProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={className} style={{ width: '100%', height: '100%', background: '#010101' }} />
    );
  }

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#010101']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, -5]} intensity={10.0} />
          <LEDScene />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default OblastLoader;
