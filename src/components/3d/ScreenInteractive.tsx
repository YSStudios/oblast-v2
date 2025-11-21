"use client";

import { useState } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { Screen } from "./Screen";
import { useScreenFocus } from "./ScreenFocusContext";
import { ScreenSaver } from "./ScreenSaver";
import { ThreeMeshUIMenu } from "./ThreeMeshUIMenu";
import type { ScreenInteractiveProps } from "./types";

export function ScreenInteractive({
  name,
  description,
  labelYOffset,
  descriptionOffset,
  zoomDistanceMultiplier,
  ...props
}: ScreenInteractiveProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { currentScreenId, zoomInComplete, clearFocus } = useScreenFocus();
  const isFocused = currentScreenId === props.panel && zoomInComplete;

  return (
    <Screen
      {...props}
      name={name}
      description={description}
      labelYOffset={labelYOffset}
      descriptionOffset={descriptionOffset}
      zoomDistanceMultiplier={zoomDistanceMultiplier}
      panelChildren={
        isFocused ? (
          <ThreeMeshUIMenu
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onExit={clearFocus}
          />
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
      
      {/* Show screensaver only when not focused */}
      {!isFocused && <ScreenSaver />}
    </Screen>
  );
}

