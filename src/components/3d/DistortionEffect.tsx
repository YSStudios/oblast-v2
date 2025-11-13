"use client";

import { forwardRef, useMemo, useEffect, useRef } from 'react';
import { Effect, BlendFunction } from 'postprocessing';
import { Uniform, DataTexture, RGBAFormat, FloatType, Vector2, NearestFilter } from 'three';
import { useThree } from '@react-three/fiber';

// Custom distortion shader
const fragmentShader = `
uniform sampler2D uDistortionTexture;
uniform vec2 uResolution;
uniform float uDistortionStrength;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Sample distortion values
  vec4 distortion = texture2D(uDistortionTexture, uv);

  // Apply distortion to UV coordinates
  vec2 distortionOffset = distortion.rg * uDistortionStrength;
  vec2 distortedUv = uv + distortionOffset;

  // Clamp to prevent sampling outside the texture
  distortedUv = clamp(distortedUv, vec2(0.0), vec2(1.0));

  // Always sample from the input buffer at the (potentially) distorted position
  outputColor = texture2D(inputBuffer, distortedUv);
}
`;

// Custom Effect class
class DistortionEffectImpl extends Effect {
  dataTexture: DataTexture;
  grid: number;

  constructor({
    grid = 20,
    strength = 0.003
  }: {
    grid?: number;
    strength?: number;
  }) {
    // Create distortion data texture
    const size = grid;
    const data = new Float32Array(4 * size * size);
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = 0;
      data[i * 4 + 1] = 0;
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 1;
    }

    const dataTexture = new DataTexture(data, size, size, RGBAFormat, FloatType);
    dataTexture.needsUpdate = true;
    // Use nearest filtering to avoid interpolation artifacts
    dataTexture.minFilter = NearestFilter;
    dataTexture.magFilter = NearestFilter;

    super('DistortionEffect', fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map([
        ['uDistortionTexture', new Uniform(dataTexture)],
        ['uResolution', new Uniform(new Vector2(typeof window !== 'undefined' ? window.innerWidth : 1920, typeof window !== 'undefined' ? window.innerHeight : 1080))],
        ['uDistortionStrength', new Uniform(strength)]
      ])
    });

    this.dataTexture = dataTexture;
    this.grid = grid;
  }
}

interface DistortionEffectProps {
  grid?: number;
  mouse?: number;
  strength?: number;
  relaxation?: number;
  distortionStrength?: number;
}

export const DistortionEffect = forwardRef<DistortionEffectImpl, DistortionEffectProps>(
  ({ grid = 20, mouse = 0.25, strength = 0.5, relaxation = 0.85, distortionStrength = 0.003 }, ref) => {
    const effect = useMemo(() => new DistortionEffectImpl({ grid, strength: distortionStrength }), [grid, distortionStrength]);
    const { size } = useThree();
    const mouseStateRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 });

    useEffect(() => {
      const dataTexture = effect.dataTexture;
      const gridSize = effect.grid;
      const data = dataTexture.image.data;

      // Mouse move handler
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

      // Animation loop
      let animationId: number;
      let frameCount = 0;
      const animate = () => {
        const mouseState = mouseStateRef.current;

        // Apply relaxation and threshold small values to zero
        const threshold = 1.0;
        for (let i = 0; i < gridSize * gridSize; i++) {
          data[i * 4] *= relaxation;
          data[i * 4 + 1] *= relaxation;

          // Zero out very small values to prevent ghosting
          if (Math.abs(data[i * 4]) < threshold) data[i * 4] = 0;
          if (Math.abs(data[i * 4 + 1]) < threshold) data[i * 4 + 1] = 0;
        }

        // Apply mouse distortion
        const gridMouseX = gridSize * mouseState.x;
        const gridMouseY = gridSize * mouseState.y;
        const maxDist = gridSize * mouse;

        let hasDistortion = false;
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            const distSq = Math.pow(gridMouseX - i, 2) + Math.pow(gridMouseY - j, 2);
            if (distSq < maxDist * maxDist) {
              const index = 4 * (i + gridSize * j);
              const power = Math.min(maxDist / Math.sqrt(distSq), 10);
              data[index] += strength * 100 * mouseState.vX * power;
              data[index + 1] -= strength * 100 * mouseState.vY * power;
              hasDistortion = true;
            }
          }
        }

        // Debug log every 60 frames
        if (frameCount++ % 60 === 0 && hasDistortion) {
          console.log('[DistortionEffect] Distortion applied:', {
            maxValue: Math.max(...Array.from(data).map(Math.abs)),
            mouseVelocity: { vX: mouseState.vX, vY: mouseState.vY }
          });
        }

        dataTexture.needsUpdate = true;
        animationId = requestAnimationFrame(animate);
      };

      window.addEventListener('mousemove', handleMouseMove);
      animate();

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        cancelAnimationFrame(animationId);
      };
    }, [effect, grid, mouse, strength, relaxation]);

    // Update resolution uniform on resize
    useEffect(() => {
      const uniforms = effect.uniforms;
      const resolutionUniform = uniforms.get('uResolution');
      if (resolutionUniform && resolutionUniform.value) {
        resolutionUniform.value.set(size.width, size.height);
      }
    }, [effect, size]);

    return <primitive ref={ref} object={effect} dispose={null} />;
  }
);

DistortionEffect.displayName = 'DistortionEffect';
