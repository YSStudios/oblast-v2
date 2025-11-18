'use client';

import { OrthographicCamera, Center, Text3D } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Leva, useControls } from 'leva';
import { Suspense, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ledFragmentShader } from './ledShader';

const OblastText = () => {
  const textRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (textRef.current) {
      textRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={textRef}>
      <Center>
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
          <meshStandardMaterial
            color="#1a3a44"
            emissive="#66b3cc"
            emissiveIntensity={1.2}
            metalness={0.2}
            roughness={0.7}
            toneMapped={false}
          />
        </Text3D>
      </Center>
    </group>
  );
};

const LEDEffectPass = ({ pixelSize, maskStagger, bloomIntensity }: { pixelSize: number; maskStagger: number; bloomIntensity: number }) => {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<any>(null);
  const effectRef = useRef<any>(null);
  const bloomRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { EffectComposer, RenderPass, EffectPass, Effect, BloomEffect, KernelSize } = require('postprocessing');

    class CustomLEDEffectImpl extends Effect {
      constructor({ pixelSize = 8.0, maskStagger = 0.5 }) {
        const uniforms = new Map([
          ['pixelSize', new THREE.Uniform(pixelSize)],
          ['maskStagger', new THREE.Uniform(maskStagger)],
        ]);

        super('CustomLEDEffect', ledFragmentShader, { uniforms });
        this.pixelSize = pixelSize;
        this.maskStagger = maskStagger;
      }

      update() {
        this.uniforms.get('pixelSize').value = this.pixelSize;
        this.uniforms.get('maskStagger').value = this.maskStagger;
      }
    }

    const composer = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Add bloom effect first
    const bloomEffect = new BloomEffect({
      intensity: bloomIntensity,
      luminanceThreshold: 0.1,
      luminanceSmoothing: 0.5,
      mipmapBlur: true,
    });
    const bloomPass = new EffectPass(camera, bloomEffect);
    composer.addPass(bloomPass);

    // Then add LED effect
    const effect = new CustomLEDEffectImpl({ pixelSize, maskStagger });
    const effectPass = new EffectPass(camera, effect);
    composer.addPass(effectPass);

    composerRef.current = composer;
    effectRef.current = effect;
    bloomRef.current = bloomEffect;

    return () => {
      composer.dispose();
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    if (composerRef.current) {
      composerRef.current.setSize(size.width, size.height);
    }
  }, [size]);

  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.pixelSize = pixelSize;
      effectRef.current.maskStagger = maskStagger;
    }
    if (bloomRef.current) {
      bloomRef.current.intensity = bloomIntensity;
    }
  }, [pixelSize, maskStagger, bloomIntensity]);

  useFrame(() => {
    if (composerRef.current) {
      composerRef.current.render();
    }
  }, 1);

  return null;
};

const Scene = () => {
  const { pixelSize, maskStagger, bloomIntensity, bloomRadius } = useControls({
    pixelSize: {
      value: 8.0,
      min: 4.0,
      max: 32.0,
      step: 1.0,
    },
    maskStagger: {
      value: 0.5,
      min: 0.0,
      max: 1.0,
      step: 0.01,
    },
    bloomIntensity: {
      value: 3.0,
      min: 0.0,
      max: 10.0,
      step: 0.1,
    },
  });

  return (
    <>
      <color attach="background" args={['#010101']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, -5]} intensity={10.0} />
      <OblastText />
      <LEDEffectPass pixelSize={pixelSize} maskStagger={maskStagger} bloomIntensity={bloomIntensity} />
    </>
  );
};

interface OblastLoaderLEDProps {
  className?: string;
}

const OblastLoaderLED = ({ className }: OblastLoaderLEDProps) => {
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

export default OblastLoaderLED;
