"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import ThreeMeshUI from "three-mesh-ui";

export function BiosScreen() {
  const containerRef = useRef<THREE.Group>(null);
  const [uiContainer, setUiContainer] = useState<ThreeMeshUI.Block | null>(
    null
  );
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress, setProgress] = useState({
    fuel: 0,
    memory: 0,
    o2: 0,
    claim: 0,
    food: 0,
  });

  // Typewriter effect - reveal lines one by one
  useEffect(() => {
    const totalLines = 12; // header + current(4) + elapsed(3) + resources(5)
    if (visibleLines < totalLines) {
      const timer = setTimeout(() => {
        setVisibleLines((prev) => prev + 1);
      }, 100); // 100ms delay between lines

      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  // Animate progress bars (only after typewriter is done)
  useEffect(() => {
    if (visibleLines < 14) return; // Don't start progress until all lines are visible

    const interval = setInterval(() => {
      setProgress((prev) => ({
        fuel: Math.min(prev.fuel + 8, 100),
        memory: Math.min(prev.memory + 6, 87),
        o2: Math.min(prev.o2 + 7, 94),
        claim: Math.min(prev.claim + 9, 100),
        food: Math.min(prev.food + 5, 76),
      }));
    }, 150);

    return () => clearInterval(interval);
  }, [visibleLines]);

  // Create BIOS UI
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing UI first
    if (uiContainer && containerRef.current) {
      containerRef.current.remove(uiContainer);
      uiContainer.clear();
      setUiContainer(null);
    }

    const container = new ThreeMeshUI.Block({
      width: 1.35,
      height: 1.35,
      padding: 0,
      justifyContent: "center",
      contentDirection: "column",
      fontFamily: "/fonts/Roboto-msdf.json",
      fontTexture: "/fonts/Roboto-msdf.png",
      backgroundColor: new THREE.Color(0x000000),
      backgroundOpacity: 0,
    });

    container.position.set(0, 0.65, 0.195);
    container.renderOrder = 999;

    let lineCount = 0;

    // Title / Header (line 0)
    if (visibleLines > lineCount) {
      const header = new ThreeMeshUI.Block({
        width: 1.28,
        height: 0.08,
        margin: 0.01,
        padding: 0.01,
        justifyContent: "center",
        contentDirection: "row",
        backgroundColor: new THREE.Color(0x000000),
        backgroundOpacity: 0,
      });

      const headerText = new ThreeMeshUI.Text({
        content: "SYSTEM INITIALIZATION",
        fontSize: 0.04,
        fontColor: new THREE.Color(0x00ff41),
      });

      header.add(headerText);
      container.add(header);
    }
    lineCount++;

    // CURRENT Section (lines 1-4)
    if (visibleLines > lineCount) {
      const currentLines = [];
      if (visibleLines > lineCount + 1)
        currentLines.push("SPD ... 127.333 KM/S ...");
      if (visibleLines > lineCount + 2)
        currentLines.push("JPJ ... [182.4] [40.9] ...");
      if (visibleLines > lineCount + 3)
        currentLines.push("SIB ... 2943.999 KM ...");

      const currentSection = createSection("CURRENT", currentLines, 0.04);
      container.add(currentSection);
    }
    lineCount += 4;

    // ELAPSED Section (lines 5-7)
    if (visibleLines > lineCount) {
      const elapsedLines = [];
      if (visibleLines > lineCount + 1) elapsedLines.push("TIME ... -.0001 S ...");
      if (visibleLines > lineCount + 2)
        elapsedLines.push("DIST ... 2955.47 KM ...");

      const elapsedSection = createSection("ELAPSED", elapsedLines, 0.04);
      container.add(elapsedSection);
    }
    lineCount += 3;

    // RESOURCES Section Header (line 8)
    if (visibleLines > lineCount) {
      const resourcesHeader = new ThreeMeshUI.Block({
        width: 1.28,
        height: 0.05,
        margin: 0.01,
        padding: 0.005,
        justifyContent: "start",
        contentDirection: "row",
        backgroundColor: new THREE.Color(0x000000),
        backgroundOpacity: 0,
      });

      const resourcesText = new ThreeMeshUI.Text({
        content: "RESOURCES",
        fontSize: 0.04,
        fontColor: new THREE.Color(0x00ff41),
      });

      resourcesHeader.add(resourcesText);
      container.add(resourcesHeader);
    }
    lineCount++;

    // Resource bars (lines 9-13)
    const resourceNames = ["FUEL", "MEMORY", "O2", "CLAIM", "FOOD"];
    const resourceValues = [
      progress.fuel,
      progress.memory,
      progress.o2,
      progress.claim,
      progress.food,
    ];

    resourceNames.forEach((name, idx) => {
      if (visibleLines > lineCount + idx) {
        const resourceRow = createResourceBar(name, resourceValues[idx]);
        container.add(resourceRow);
      }
    });

    // Initialize geometry
    let frameCount = 0;
    const initializeGeometry = () => {
      ThreeMeshUI.update();
      frameCount++;

      if (frameCount < 3) {
        requestAnimationFrame(initializeGeometry);
      } else {
        if (containerRef.current) {
          containerRef.current.add(container);
          setUiContainer(container);
        }
      }
    };

    initializeGeometry();

    return () => {
      if (containerRef.current && container) {
        containerRef.current.remove(container);
        container.clear();
      }
    };
  }, [progress, visibleLines]);

  return <group ref={containerRef} />;
}

// Helper function to create a section
function createSection(
  title: string,
  lines: string[],
  fontSize: number
): ThreeMeshUI.Block {
  // Adjust height based on number of lines
  const lineHeight = 0.03;
  const titleHeight = 0.04;
  const totalHeight = titleHeight + lines.length * lineHeight + 0.02;

  const section = new ThreeMeshUI.Block({
    width: 1.28,
    height: totalHeight,
    margin: 0.008,
    padding: 0.01,
    justifyContent: "start",
    contentDirection: "column",
    backgroundColor: new THREE.Color(0x000000),
    backgroundOpacity: 0,
  });

  // Title
  const titleBlock = new ThreeMeshUI.Block({
    width: 1.26,
    height: 0.04,
    margin: 0.002,
    justifyContent: "start",
    contentDirection: "row",
    backgroundColor: new THREE.Color(0x000000),
    backgroundOpacity: 0,
  });

  const titleText = new ThreeMeshUI.Text({
    content: title,
    fontSize: fontSize,
    fontColor: new THREE.Color(0x00ff41),
  });

  titleBlock.add(titleText);
  section.add(titleBlock);

  // Lines
  lines.forEach((line) => {
    const lineBlock = new ThreeMeshUI.Block({
      width: 1.26,
      height: 0.03,
      margin: 0.001,
      justifyContent: "start",
      contentDirection: "row",
      backgroundColor: new THREE.Color(0x000000),
      backgroundOpacity: 0,
    });

    const lineText = new ThreeMeshUI.Text({
      content: line,
      fontSize: 0.028,
      fontColor: new THREE.Color(0x00ff41),
    });

    lineBlock.add(lineText);
    section.add(lineBlock);
  });

  return section;
}

// Helper function to create a resource bar
function createResourceBar(name: string, value: number): ThreeMeshUI.Block {
  const barLength = 15;
  const filled = Math.floor((value / 100) * barLength);
  const empty = barLength - filled;
  const bar = "#".repeat(filled) + "-".repeat(empty);

  const resourceRow = new ThreeMeshUI.Block({
    width: 1.28,
    height: 0.035,
    margin: 0.003,
    padding: 0.005,
    justifyContent: "start",
    contentDirection: "row",
    backgroundColor: new THREE.Color(0x000000),
    backgroundOpacity: 0,
  });

  const resourceText = new ThreeMeshUI.Text({
    content: `${name.padEnd(8)} ${Math.floor(value)
      .toString()
      .padStart(3)}%: ${bar}`,
    fontSize: 0.025,
    fontColor: new THREE.Color(0x00ff41),
  });

  resourceRow.add(resourceText);

  return resourceRow;
}
