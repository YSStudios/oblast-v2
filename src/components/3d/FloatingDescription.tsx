"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { Group, Vector3, Box3, Quaternion, Matrix4 } from "three";
import { useScreenFocus } from "./Computers";

export function FloatingDescription() {
  const groupRef = useRef<Group>(null);
  const [opacity, setOpacity] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const animationProgress = useRef(0);
  const { currentScreenId, screens, focusTarget, zoomInComplete } =
    useScreenFocus();

  // Generate random character
  const randomChar = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    return chars[Math.floor(Math.random() * chars.length)];
  };

  useFrame((state, delta) => {
    // Smooth fade in/out animation - only show when zoom-in is complete
    if (currentScreenId && focusTarget && zoomInComplete) {
      setOpacity((prev) => Math.min(prev + delta * 3, 1));
    } else {
      setOpacity((prev) => Math.max(prev - delta * 3, 0));
      animationProgress.current = 0; // Reset animation when hiding
    }

    // Update position to follow the focused screen
    if (groupRef.current && currentScreenId && screens.length > 0) {
      const screenData = screens.find((s) => s.id === currentScreenId);
      if (screenData?.ref?.current) {
        // Update world matrix to get accurate position
        screenData.ref.current.updateWorldMatrix(true, false);

        // Get the bounding box and center of the screen
        const bbox = new Box3().setFromObject(screenData.ref.current);
        const center = new Vector3();
        bbox.getCenter(center);

        // Extract the screen's rotation from its world matrix
        const worldMatrix = screenData.ref.current.matrixWorld;

        // Extract the screen's normal (forward) direction
        const normalWorld = new Vector3();
        normalWorld
          .set(
            worldMatrix.elements[8],
            worldMatrix.elements[9],
            worldMatrix.elements[10]
          )
          .normalize();

        // Extract the screen's up direction
        const upWorld = new Vector3();
        upWorld
          .set(
            worldMatrix.elements[4],
            worldMatrix.elements[5],
            worldMatrix.elements[6]
          )
          .normalize();

        // Use custom offsets if provided, otherwise use defaults
        const forwardDistance = screenData.descriptionOffset?.forward ?? 0.15;
        const upDistance = screenData.descriptionOffset?.up ?? 0.6;

        // Position text in front of the screen along its normal, and up along its local up
        const forwardOffset = normalWorld.multiplyScalar(forwardDistance);
        const upLocalOffset = upWorld.multiplyScalar(upDistance);

        groupRef.current.position.copy(
          center.clone().add(forwardOffset).add(upLocalOffset)
        );

        // Extract rotation quaternion from the world matrix (without position/scale)
        const rotationMatrix = new Matrix4();
        rotationMatrix.extractRotation(worldMatrix);
        const quaternion = new Quaternion();
        quaternion.setFromRotationMatrix(rotationMatrix);

        // Apply the screen's rotation to the text so it's perpendicular to the monitor
        groupRef.current.quaternion.copy(quaternion);
      }
    }

    // Animate text scramble effect
    const screenData = screens.find((s) => s.id === currentScreenId);
    const description = screenData?.description || "";

    if (zoomInComplete && description) {
      animationProgress.current += delta * 0.9; // Speed of animation (slower)

      if (animationProgress.current >= 1) {
        setDisplayText(description);
      } else {
        const progress = animationProgress.current;
        const revealedChars = Math.floor(description.length * progress);

        let newText = "";
        for (let i = 0; i < description.length; i++) {
          if (i < revealedChars) {
            newText += description[i];
          } else if (description[i] === " " || description[i] === "-") {
            newText += description[i]; // Keep spaces and dashes
          } else {
            newText += randomChar();
          }
        }
        setDisplayText(newText);
      }
    } else if (!zoomInComplete) {
      setDisplayText("");
    }
  });

  // Don't render if no screen is focused, zoom not complete, or opacity is too low
  if (!currentScreenId || !focusTarget || !zoomInComplete || opacity < 0.01)
    return null;

  const screenData = screens.find((s) => s.id === currentScreenId);

  // Use custom text Y offset if provided, otherwise use default
  const textYOffset = screenData?.descriptionOffset?.textY ?? 0.7;

  return (
    <group ref={groupRef}>
      <Text
        position={[0, textYOffset, 0]}
        fontSize={0.03}
        color="#ff2919"
        anchorX="center"
        anchorY="top"
        font="/fonts/Inter-Medium.woff"
        fillOpacity={opacity}
        outlineWidth={0.003}
        outlineColor="#000000"
        outlineOpacity={opacity * 0.6}
        renderOrder={10000}
        material-depthTest={false}
        material-depthWrite={false}
        maxWidth={1.2}
        textAlign="left"
        lineHeight={1.2}
      >
        {displayText}
      </Text>
    </group>
  );
}
