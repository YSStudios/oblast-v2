"use client";

import dynamic from "next/dynamic";
import { Suspense, useState, useEffect } from "react";
import * as React from "react";

const OblastLoaderLED = dynamic(() => import("@/components/3d/OblastLoaderLED"), {
  ssr: false,
});

const Scene = dynamic(() => import("@/components/3d/Scene"), {
  ssr: false,
});

export default function Home() {
  const [showLoader, setShowLoader] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Start fade out animation at 9.5 seconds
    const fadeOutTimer = setTimeout(() => {
      setFadeOut(true);
    }, 9500);

    // Remove loader at 10 seconds (after fade out completes)
    const removeTimer = setTimeout(() => {
      setShowLoader(false);
      setFadeIn(true);
    }, 10000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (showLoader) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          opacity: fadeOut ? 0 : 1,
          transition: "opacity 0.5s ease-in-out",
        }}
      >
        <OblastLoaderLED />
      </div>
    );
  }

  return (
    <div
      style={{
        opacity: fadeIn ? 1 : 0,
        transition: "opacity 0.5s ease-in-out",
      }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
      <Overlay />
    </div>
  );
}

function Overlay() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          fontSize: "13px",
          color: "#f0f0f0",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Oblast Studio
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 40,
          fontSize: "13px",
          color: "#f0f0f0",
        }}
      >
        {new Date().toLocaleDateString()}
      </div>
      <NavigationArrows />
    </div>
  );
}

function NavigationArrows() {
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    // Listen for custom events from the 3D scene
    const handleFocusChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ focused: boolean }>;
      setIsFocused(customEvent.detail.focused);
    };

    window.addEventListener("screenFocusChange", handleFocusChange);
    return () => {
      window.removeEventListener("screenFocusChange", handleFocusChange);
    };
  }, []);

  if (!isFocused) return null;

  const handleLeftClick = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
  };

  const handleRightClick = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
  };

  return (
    <>
      {/* Left Arrow */}
      <div
        onClick={handleLeftClick}
        style={{
          position: "absolute",
          left: "10%",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "auto",
          cursor: "pointer",
          fontSize: "32px",
          color: "#35c19f",
          textShadow: "0 0 20px rgba(53, 193, 159, 0.5)",
          transition: "all 0.2s",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.transform = "translateY(-50%) scale(1.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#35c19f";
          e.currentTarget.style.transform = "translateY(-50%) scale(1)";
        }}
      >
        ←
      </div>

      {/* Right Arrow */}
      <div
        onClick={handleRightClick}
        style={{
          position: "absolute",
          right: "10%",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "auto",
          cursor: "pointer",
          fontSize: "32px",
          color: "#35c19f",
          textShadow: "0 0 20px rgba(53, 193, 159, 0.5)",
          transition: "all 0.2s",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.transform = "translateY(-50%) scale(1.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#35c19f";
          e.currentTarget.style.transform = "translateY(-50%) scale(1)";
        }}
      >
        →
      </div>
    </>
  );
}
