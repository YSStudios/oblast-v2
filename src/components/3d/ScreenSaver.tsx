"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

// ===== MANUAL CALIBRATION SETTINGS =====
const POSITION = {
  x: -10,    // Left(-) / Right(+)
  y: 2.5,    // Down(-) / Up(+)
  z: -17,    // Back(-) / Forward(+)
};

const BOUNDS = {
  minX: -2.5,  // Left boundary
  maxX: 2.5,   // Right boundary
  minY: -2,    // Bottom boundary
  maxY: 2,     // Top boundary
};

const FONT_SIZE = 1;  // Adjust text size
// =======================================

export function ScreenSaver() {
  const textRef = useRef<THREE.Mesh>(null);
  const velocityRef = useRef({ x: 0.8, y: 0.6 });
  const [color, setColor] = useState("#FF0000");
  
  const bounds = BOUNDS;

  const colors = [
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FF8800", // Orange
    "#8800FF", // Purple
  ];

  useFrame((state, delta) => {
    if (!textRef.current) return;

    // Update position based on velocity
    textRef.current.position.x += velocityRef.current.x * delta;
    textRef.current.position.y += velocityRef.current.y * delta;

    // Check for collisions and bounce
    let bounced = false;

    if (textRef.current.position.x >= bounds.maxX || textRef.current.position.x <= bounds.minX) {
      velocityRef.current.x *= -1;
      bounced = true;
    }

    if (textRef.current.position.y >= bounds.maxY || textRef.current.position.y <= bounds.minY) {
      velocityRef.current.y *= -1;
      bounced = true;
    }

    // Change color on bounce (classic DVD behavior)
    if (bounced) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setColor(randomColor);
    }
  });

  return (
    <group position={[POSITION.x, POSITION.y, POSITION.z]}>
      {/* Bouncing "MENU" text */}
      <Text
        ref={textRef}
        position={[0, 0, 0]}
        fontSize={FONT_SIZE}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Medium.woff"
        letterSpacing={0.2}
        fontWeight="bold"
      >
        MENU
      </Text>
    </group>
  );
}

