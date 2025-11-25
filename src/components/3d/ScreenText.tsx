"use client";

import * as THREE from "three";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Text } from "@react-three/drei";
import { Screen } from "./Screen";
import type { ScreenTextProps } from "./types";

export function ScreenText({
  invert,
  x = 0,
  y = 1.2,
  name,
  description,
  url,
  labelYOffset,
  descriptionOffset,
  ...props
}: ScreenTextProps) {
  const textRef = useRef<THREE.Mesh>(null);
  const [rand] = useState(() => Math.random() * 10000);
  useFrame((state) => {
    if (textRef.current) {
      textRef.current.position.x =
        x + Math.sin(rand + state.clock.elapsedTime / 4) * 3.3;
    }
  });
  return (
    <Screen
      {...props}
      name={name}
      description={description}
      url={url}
      labelYOffset={labelYOffset}
      descriptionOffset={descriptionOffset}
    >
      <PerspectiveCamera
        makeDefault
        manual
        aspect={1 / 1}
        position={[0, 0, 15]}
      />
      <color attach="background" args={[invert ? "black" : "#35c19f"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <Text
        font="/fonts/Inter-Medium.woff"
        position={[x, y, 0]}
        ref={textRef}
        fontSize={4}
        letterSpacing={-0.1}
        color={!invert ? "black" : "#35c19f"}
      >
        Oblast
      </Text>
    </Screen>
  );
}

