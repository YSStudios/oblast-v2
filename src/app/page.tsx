"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

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
    <div
      style={{
        width: "100%",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
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
    </div>
  );
}
