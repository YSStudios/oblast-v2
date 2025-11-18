'use client';

import { EffectComposer, wrapEffect } from '@react-three/postprocessing';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
// @ts-expect-error - postprocessing types
import { Effect } from 'postprocessing';

import { ledFragmentShader } from './ledShader';

class CustomLEDEffectImpl extends Effect {
  pixelSize: number;
  maskStagger: number;

  constructor({ pixelSize = 8.0, maskStagger = 0.5 }: { pixelSize?: number; maskStagger?: number } = {}) {
    const uniforms = new Map([
      ['pixelSize', new THREE.Uniform(pixelSize)],
      ['maskStagger', new THREE.Uniform(maskStagger)],
    ]);

    super('CustomLEDEffect', ledFragmentShader, {
      uniforms,
    });

    this.pixelSize = pixelSize;
    this.maskStagger = maskStagger;
  }

  update(_renderer: any, _inputBuffer: any, _deltaTime: number) {
    // @ts-expect-error - uniforms exists on Effect
    const uniforms = this.uniforms;
    if (uniforms) {
      uniforms.get('pixelSize').value = this.pixelSize;
      uniforms.get('maskStagger').value = this.maskStagger;
    }
  }
}

// @ts-expect-error - wrapEffect types
const CustomLEDEffect = wrapEffect(CustomLEDEffectImpl);

interface LEDEffectProps {
  pixelSize?: number;
  maskStagger?: number;
}

export const LEDEffect = ({ pixelSize = 8.0, maskStagger = 0.5 }: LEDEffectProps) => {
  const effectRef = useRef<any>(null);

  useFrame((state) => {
    const { camera } = state;

    if (effectRef.current) {
      effectRef.current.pixelSize = pixelSize;
      effectRef.current.maskStagger = maskStagger;
    }

    camera.lookAt(0, 0, 0);
  });

  return (
    <EffectComposer>
      <CustomLEDEffect ref={effectRef} pixelSize={pixelSize} maskStagger={maskStagger} />
    </EffectComposer>
  );
};
