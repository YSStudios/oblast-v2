'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, MeshReflectorMaterial, BakeShadows } from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing'
import { easing } from 'maath'
import { suspend } from 'suspend-react'
import { Instances, Computers, ScreenFocusProvider, useScreenFocus } from './Computers'
import type { Vector3, BufferGeometry } from 'three'
import { useEffect } from 'react'
import * as THREE from 'three'

const suzi = import('@pmndrs/assets/models/bunny.glb')

export default function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [-1.5, 1, 5.5], fov: 45, near: 1, far: 20 }}
      eventPrefix="client"
      style={{ width: '100%', height: '100vh' }}
    >
      <ScreenFocusProvider>
        <color attach="background" args={['black']} />
        <hemisphereLight intensity={0.15} groundColor="black" />
        <spotLight
          decay={0}
          position={[10, 20, 10]}
          angle={0.12}
          penumbra={1}
          intensity={1}
          castShadow
          shadow-mapSize={1024}
        />
        <group position={[0, -1, 0]}>
          <Instances>
            <Computers scale={0.5} />
          </Instances>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[50, 50]} />
            <MeshReflectorMaterial
              blur={[100, 10]}
              resolution={2048}
              mixBlur={0.5}
              mixStrength={80}
              roughness={1}
              depthScale={1.2}
              minDepthThreshold={0.4}
              maxDepthThreshold={1.4}
              color="#202020"
              metalness={0.8}
            />
          </mesh>
          <Bun scale={0.4} position={[0, 0.3, 0.5]} rotation={[0, -Math.PI * 0.85, 0]} />
          <pointLight distance={1.5} intensity={1} position={[-0.15, 0.7, 0]} color="orange" />
        </group>
        <EffectComposer>
          <Bloom luminanceThreshold={0} mipmapBlur luminanceSmoothing={0.0} intensity={3} />
          <DepthOfField target={[0, 0, 5.5]} focalLength={0.05} bokehScale={2} height={700} />
        </EffectComposer>
        <CameraRig />
        <BakeShadows />
      </ScreenFocusProvider>
    </Canvas>
  )
}

interface BunProps {
  scale?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
}

function Bun(props: BunProps) {
  const model = suspend(suzi) as { default: string }
  const { nodes } = useGLTF(model.default) as unknown as { nodes: { mesh: { geometry: BufferGeometry } } }
  return (
    <mesh receiveShadow castShadow geometry={nodes.mesh.geometry} {...props}>
      <meshStandardMaterial color="#222" roughness={0.5} />
    </mesh>
  )
}

function CameraRig() {
  const { focusTarget, clearFocus, completeClearFocus, isTransitioning, mouseFollowEnabled, toggleMouseFollow } = useScreenFocus()

  useFrame((state, delta) => {
    if (focusTarget && !isTransitioning) {
      // Smoothly move camera to focused screen position
      easing.damp3(
        state.camera.position as Vector3,
        focusTarget.cameraPosition,
        0.3,
        delta
      )
      
      // Calculate the target rotation (quaternion) to look at the screen
      const lookAtTarget = new THREE.Vector3(...focusTarget.lookAt)
      const tempCamera = new THREE.PerspectiveCamera()
      tempCamera.position.copy(state.camera.position)
      tempCamera.lookAt(lookAtTarget)
      
      // Smoothly interpolate the camera's rotation
      state.camera.quaternion.slerp(tempCamera.quaternion, delta * 3)
    } else if (isTransitioning && focusTarget) {
      // Transition back to original position and rotation
      // During transition, ignore mouse input to prevent jerking
      easing.damp3(
        state.camera.position as Vector3,
        focusTarget.originalPosition,
        0.25,  // Slightly slower for smoother transition
        delta
      )
      
      // Smoothly interpolate back to original rotation
      const originalQuat = new THREE.Quaternion(
        focusTarget.originalQuaternion[0],
        focusTarget.originalQuaternion[1],
        focusTarget.originalQuaternion[2],
        focusTarget.originalQuaternion[3]
      )
      state.camera.quaternion.slerp(originalQuat, delta * 2)  // Slower rotation for smoothness
      
      // Check if we're very close to the original position to complete the transition
      const distanceToOriginal = state.camera.position.distanceTo(
        new THREE.Vector3(...focusTarget.originalPosition)
      )
      const quatDifference = state.camera.quaternion.angleTo(originalQuat)
      
      // Much tighter tolerance - wait until we're very close
      if (distanceToOriginal < 0.005 && quatDifference < 0.005) {
        completeClearFocus()
      }
    } else if (mouseFollowEnabled) {
      // Normal mouse-following behavior (only if enabled)
      const target: [number, number, number] = [
        -1 + (state.pointer.x * state.viewport.width) / 3,
        (1 + state.pointer.y) / 2,
        5.5
      ]
      easing.damp3(
        state.camera.position as Vector3,
        target,
        0.5,
        delta
      )
      state.camera.lookAt(0, 0, 0)
    }
    // If mouseFollowEnabled is false, camera stays in current position
  })

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusTarget && !isTransitioning) {
        clearFocus()
      }
      // Toggle mouse follow with 'M' key
      if (e.key === 'm' || e.key === 'M') {
        toggleMouseFollow()
        console.log('Mouse follow:', !mouseFollowEnabled ? 'enabled' : 'disabled')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusTarget, clearFocus, isTransitioning, toggleMouseFollow, mouseFollowEnabled])

  return null
}
