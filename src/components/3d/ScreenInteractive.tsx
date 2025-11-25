"use client";

import { useState, useEffect } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { Screen } from "./Screen";
import { useScreenFocus } from "./ScreenFocusContext";
import { GeometricLoadingScreen } from "./GeometricLoadingScreen";
import { BiosScreen } from "./BiosScreen";
import { ThreeMeshUIMenu } from "./ThreeMeshUIMenu";
import type { ScreenInteractiveProps } from "./types";

export function ScreenInteractive({
  name,
  description,
  url,
  labelYOffset,
  descriptionOffset,
  zoomDistanceMultiplier,
  ...props
}: ScreenInteractiveProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const { currentScreenId, zoomInComplete, clearFocus } = useScreenFocus();
  const isFocused = currentScreenId === props.panel && zoomInComplete;

  // Add delay after zoom completes before showing menu
  useEffect(() => {
    if (isFocused) {
      // Show loading screen for 2 seconds after zoom completes
      const timer = setTimeout(() => {
        setLoadingComplete(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // Reset loading state when not focused
      setLoadingComplete(false);
    }
  }, [isFocused]);

  return (
    <Screen
      {...props}
      name={name}
      description={description}
      url={url}
      labelYOffset={labelYOffset}
      descriptionOffset={descriptionOffset}
      zoomDistanceMultiplier={zoomDistanceMultiplier}
      panelChildren={
        isFocused ? (
          loadingComplete ? (
            <ThreeMeshUIMenu
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              onExit={clearFocus}
            />
          ) : (
            <BiosScreen />
          )
        ) : null
      }
    >
      <PerspectiveCamera
        makeDefault
        manual
        aspect={1 / 1}
        position={[0, 0, 15]}
      />
      <color attach="background" args={["#0a0a0a"]} />
      <ambientLight intensity={Math.PI / 2} />
      <pointLight decay={0} position={[10, 10, 10]} intensity={Math.PI} />
      <pointLight decay={0} position={[-10, -10, -10]} />

      {/* Show geometric loading screen when not focused */}
      {!isFocused && (
        <GeometricLoadingScreen scale={0.4} position={[-4.6, 1.1, 0]} />
      )}
    </Screen>
  );
}
