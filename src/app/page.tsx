"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import * as React from "react";

const Scene = dynamic(() => import("@/components/3d/Scene"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#f0f0f0",
        fontFamily: "Inter, sans-serif",
      }}
    >
      Loading...
    </div>
  ),
});

export default function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
      <Overlay />
    </>
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
