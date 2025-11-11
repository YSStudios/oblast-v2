'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, MeshReflectorMaterial, BakeShadows } from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing'
import { easing } from 'maath'
import { suspend } from 'suspend-react'
import { Instances, Computers } from './Computers'
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
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0} mipmapBlur luminanceSmoothing={0.0} intensity={3} />
        <DepthOfField target={[0, 0, 5.5]} focalLength={0.05} bokehScale={2} height={700} />
      </EffectComposer>
      <CameraRig />
      <BakeShadows />
    </Canvas>
  )
}

interface BunProps {
  scale?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
}

function Bun(props: BunProps) {
  const { nodes } = useGLTF(suspend(suzi).default) as any
  return (
    <mesh receiveShadow castShadow geometry={nodes.mesh.geometry} {...props}>
      <meshStandardMaterial color="#222" roughness={0.5} />
    </mesh>
  )
}

function CameraRig() {
  useFrame((state, delta) => {
    easing.damp3(
      state.camera.position as any,
      [-1 + (state.pointer.x * state.viewport.width) / 3, (1 + state.pointer.y) / 2, 5.5] as any,
      0.5,
      delta
    )
    state.camera.lookAt(0, 0, 0)
  })
  return null
}
