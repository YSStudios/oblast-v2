'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import * as THREE from 'three'

interface SpinningBoxProps {
  scale: number
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export function SpinningBox({ scale, ...props }: SpinningBoxProps) {
  const ref = useRef<THREE.Mesh>(null)
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  useCursor(hovered)

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x = ref.current.rotation.y += delta
    }
  })

  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? scale * 1.4 : scale * 1.2}
      onClick={() => click(!clicked)}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}>
      <boxGeometry />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'indianred'} />
    </mesh>
  )
}
