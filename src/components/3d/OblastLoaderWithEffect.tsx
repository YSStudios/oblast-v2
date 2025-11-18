'use client';

import { OrthographicCamera, Center, Text3D } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Pixelation } from '@react-three/postprocessing';
import { Leva, useControls } from 'leva';
import { Suspense, useRef } from 'react';
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

const Scene = () => {
  const { granularity } = useControls({
    granularity: {
      value: 8,
      min: 1,
      max: 32,
      step: 1,
    },
  });

  return (
    <>
      <color attach="background" args={['#010101']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, -5]} intensity={10.0} />
      <OblastText />
      <EffectComposer>
        <Pixelation granularity={granularity} />
      </EffectComposer>
    </>
  );
};

interface OblastLoaderWithEffectProps {
  className?: string;
}

const OblastLoaderWithEffect = ({ className }: OblastLoaderWithEffectProps) => {
  return (
    <>
      <div className={className} style={{ width: '100%', height: '100%' }}>
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 5], fov: 50 }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>
      <Leva collapsed />
    </>
  );
};

export default OblastLoaderWithEffect;
