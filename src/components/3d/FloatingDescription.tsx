"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Line } from "@react-three/drei";
import { Group, Vector3, Quaternion, Matrix4 } from "three";
import { useScreenFocus } from "./ScreenFocusContext";

export function FloatingDescription() {
  const groupRef = useRef<Group>(null);
  const [opacity, setOpacity] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [displayLinkText, setDisplayLinkText] = useState("");
  const [linkHovered, setLinkHovered] = useState(false);
  const animationProgress = useRef(0);
  const linkAnimationProgress = useRef(0);
  const lastUpdateTime = useRef(0);
  const { currentScreenId, screens, focusTarget, zoomInComplete } =
    useScreenFocus();

  // Create pill outline points
  const pillOutlinePoints = useMemo(() => {
    const width = 0.15;
    const height = 0.032;
    const radius = height / 2; // Perfect pill shape
    const segments = 16;
    const points: [number, number, number][] = [];

    // Right semicircle (top to bottom)
    for (let i = 0; i <= segments / 2; i++) {
      const angle = -Math.PI / 2 + (Math.PI * i) / (segments / 2);
      points.push([
        width / 2 - radius + Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0,
      ]);
    }

    // Left semicircle (bottom to top)
    for (let i = 0; i <= segments / 2; i++) {
      const angle = Math.PI / 2 + (Math.PI * i) / (segments / 2);
      points.push([
        -width / 2 + radius + Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0,
      ]);
    }

    // Close the loop
    points.push(points[0]);

    return points;
  }, []);

  // Generate random character
  const randomChar = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    return chars[Math.floor(Math.random() * chars.length)];
  };

  useFrame((state, delta) => {
    // Smooth fade in/out animation - only show when zoom-in is complete (only update when changing)
    if (currentScreenId && focusTarget && zoomInComplete) {
      setOpacity((prev) => {
        const next = Math.min(prev + delta * 3, 1);
        return Math.abs(next - prev) > 0.01 ? next : prev;
      });
    } else {
      setOpacity((prev) => {
        const next = Math.max(prev - delta * 3, 0);
        return Math.abs(next - prev) > 0.01 ? next : prev;
      });
      animationProgress.current = 0; // Reset animation when hiding
    }

    // Update position to follow the focused screen (throttle to 30fps)
    const now = state.clock.elapsedTime;
    if (
      groupRef.current &&
      currentScreenId &&
      screens.length > 0 &&
      now - lastUpdateTime.current > 1 / 30
    ) {
      lastUpdateTime.current = now;
      const screenData = screens.find((s) => s.id === currentScreenId);
      if (screenData?.ref?.current) {
        // Update world matrix to get accurate position
        screenData.ref.current.updateWorldMatrix(true, false);

        // Get the bounding box from the mesh geometry only (not children)
        // This avoids issues with three-mesh-ui blocks that may not be initialized
        const geometry = screenData.ref.current.geometry;
        if (!geometry || !geometry.boundingBox) {
          geometry?.computeBoundingBox();
        }

        const bbox = geometry?.boundingBox;
        if (!bbox) {
          return;
        }

        // Transform bounding box to world space
        const center = new Vector3();
        bbox.getCenter(center);
        screenData.ref.current.localToWorld(center);

        // Check for NaN values before proceeding
        if (isNaN(center.x) || isNaN(center.y) || isNaN(center.z)) {
          return;
        }

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
        const forwardOffset = normalWorld
          .clone()
          .multiplyScalar(forwardDistance);
        const upLocalOffset = upWorld.clone().multiplyScalar(upDistance);

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
        if (displayText !== description) {
          setDisplayText(description);
        }
      } else {
        // Only update every other frame for performance
        if (Math.floor(state.clock.elapsedTime * 30) % 2 === 0) {
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
      }
    } else if (!zoomInComplete) {
      if (displayText !== "") {
        setDisplayText("");
      }
    }

    // Animate link text scramble effect
    if (zoomInComplete && screenData?.url) {
      // Extract website name from URL
      let linkText = screenData.url
        .replace(/^https?:\/\//, "") // Remove protocol
        .replace(/^www\./, "") // Remove www.
        .split("/")[0]; // Get domain only

      // Remove only common TLD extensions (.com, .org, .net, etc.) but keep .earth and .agency
      linkText = linkText.replace(
        /\.(com|org|net|io|dev|co|app|xyz|tech)$/i,
        ""
      );

      linkAnimationProgress.current += delta * 0.9; // Same speed as description

      if (linkAnimationProgress.current >= 1) {
        if (displayLinkText !== linkText) {
          setDisplayLinkText(linkText);
        }
      } else {
        // Only update every other frame for performance
        if (Math.floor(state.clock.elapsedTime * 30) % 2 === 0) {
          const progress = linkAnimationProgress.current;
          const revealedChars = Math.floor(linkText.length * progress);

          let newText = "";
          for (let i = 0; i < linkText.length; i++) {
            if (i < revealedChars) {
              newText += linkText[i];
            } else if (linkText[i] === " ") {
              newText += " "; // Keep spaces
            } else {
              newText += randomChar();
            }
          }
          setDisplayLinkText(newText);
        }
      }
    } else if (!zoomInComplete) {
      if (displayLinkText !== "") {
        setDisplayLinkText("");
      }
      linkAnimationProgress.current = 0; // Reset animation when hiding
    }
  });

  // Don't render if no screen is focused, zoom not complete, or opacity is too low
  if (!currentScreenId || !focusTarget || !zoomInComplete || opacity < 0.01)
    return null;

  const screenData = screens.find((s) => s.id === currentScreenId);

  // Use custom text Y offset if provided, otherwise use default
  const textYOffset = screenData?.descriptionOffset?.textY ?? 0.7;

  // Handle link click
  const handleLinkClick = () => {
    if (screenData?.url) {
      window.open(screenData.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <group ref={groupRef}>
      <Text
        position={[0, textYOffset, 0]}
        fontSize={0.02}
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
        maxWidth={0.7}
        textAlign="left"
        lineHeight={1.2}
      >
        {displayText}
      </Text>

      {/* Link button - only show if URL exists */}
      {screenData?.url && (
        <group position={[0.4, textYOffset - 0.03, 0]}>
          {/* Pill outline using Line */}
          <Line
            points={pillOutlinePoints}
            color={linkHovered ? "#ffffff" : "#35c19f"}
            lineWidth={1.5}
            transparent
            opacity={opacity}
            renderOrder={10001}
            depthTest={false}
          />

          {/* Invisible clickable area */}
          <mesh
            position={[0, 0, 0]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setLinkHovered(true);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setLinkHovered(false);
              document.body.style.cursor = "auto";
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleLinkClick();
            }}
          >
            <planeGeometry args={[0.15, 0.032]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>

          {/* Link text */}
          <Text
            position={[0, 0, 0.001]}
            fontSize={0.015}
            color={linkHovered ? "#ffffff" : "#35c19f"}
            anchorX="center"
            anchorY="middle"
            font="/fonts/Inter-Medium.woff"
            fillOpacity={opacity}
            renderOrder={10002}
            material-depthTest={false}
            material-depthWrite={false}
          >
            {displayLinkText}
          </Text>
        </group>
      )}
    </group>
  );
}
