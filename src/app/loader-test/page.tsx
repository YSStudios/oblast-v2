'use client';

import dynamic from 'next/dynamic';

const OblastLoaderLED = dynamic(
  () => import("@/components/3d/OblastLoaderLED"),
  { ssr: false }
);

export default function LoaderTest() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <OblastLoaderLED />
    </div>
  );
}
