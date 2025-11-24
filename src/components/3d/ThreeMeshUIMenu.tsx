"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import ThreeMeshUI from "three-mesh-ui";

// Type definitions for three-mesh-ui (library lacks official types)
type ThreeMeshUIBlock = ThreeMeshUI.Block & {
  children: ThreeMeshUIElement[];
  userData?: {
    type?: string;
    action?: () => void;
    id?: string;
  };
  set?: (props: Record<string, unknown>) => void;
};

type ThreeMeshUIElement = {
  isUI?: boolean;
  content?: string;
  fontColor?: THREE.Color;
  material?: THREE.Material & { color: THREE.Color };
  set?: (props: Record<string, unknown>) => void;
  children?: ThreeMeshUIElement[];
  backgroundOpacity?: number;
};

interface ThreeMeshUIMenuProps {
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;
  onExit: () => void;
}

type SectionKey = "about" | "team" | "services" | "contact";

interface SectionData {
  title: string;
  description: string;
}

export function ThreeMeshUIMenu({
  activeSection,
  setActiveSection,
  onExit,
}: ThreeMeshUIMenuProps) {
  const containerRef = useRef<THREE.Group>(null);
  const { raycaster, camera, mouse, gl } = useThree();
  const [uiContainer, setUiContainer] = useState<ThreeMeshUIBlock | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const currentContainerRef = useRef<ThreeMeshUIBlock | null>(null);
  const hoveredElementRef = useRef<ThreeMeshUIBlock | null>(null);
  const needsUpdate = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  // Cache color objects to avoid creating new ones every frame
  const colors = useMemo(
    () => ({
      green: new THREE.Color(0x00ff00),
      red: new THREE.Color(0xff0000),
      dark: new THREE.Color(0x1a1a1a),
    }),
    []
  );

  // Helper function to reset button background color
  const resetButtonColor = useCallback(
    (button: ThreeMeshUIBlock) => {
      if (!button.set) return;
      const isExitButton =
        button.userData?.id === "exit" || button.userData?.id === "back";
      button.set({
        backgroundColor: isExitButton ? colors.red : colors.dark,
        backgroundOpacity: 0.8,
      });
      needsUpdate.current = true;
    },
    [colors]
  );

  const sections = useMemo<Record<SectionKey, SectionData>>(
    () => ({
      about: {
        title: "About Us",
        description:
          "We are a forward-thinking technology company dedicated to creating innovative solutions that transform businesses and enhance user experiences through cutting-edge design and development.",
      },
      team: {
        title: "Our Team",
        description:
          "Our diverse team brings together experienced professionals, talented engineers, and creative designers who are passionate about pushing boundaries and delivering exceptional results.",
      },
      services: {
        title: "Our Services",
        description:
          "We specialize in web development, 3D visualization, interactive experiences, consulting, and ongoing support. Our portfolio includes projects like Kirill.Agency, Bourne Creatives, and Vega.Earth.",
      },
      contact: {
        title: "Contact Us",
        description:
          "Get in touch with us at oblaststudio@gmail.com. We're based in NYC and Baltimore, ready to bring your vision to life.",
      },
    }),
    []
  );

  const mainMenuItems = useMemo(
    () =>
      [
        { id: "about", label: "About" },
        { id: "team", label: "Team" },
        { id: "services", label: "Services" },
        { id: "contact", label: "Contact" },
      ] as const,
    []
  );

  // Create the UI
  const createUI = useCallback(() => {
    if (!containerRef.current) return;

    // Create main container with explicit dimensions to avoid NaN
    const container = new ThreeMeshUI.Block({
      width: 0.9,
      height: 0.9,
      padding: 0.05,
      justifyContent: "center",
      contentDirection: "column",
      fontFamily: "/fonts/Roboto-msdf.json",
      fontTexture: "/fonts/Roboto-msdf.png",
      backgroundColor: new THREE.Color(0x0a0a0a),
      backgroundOpacity: 0.95,
      bestFit: "shrink",
    });

    // Position higher for better centering in the monitor frame
    const yPosition = activeSection ? 0.62 : 0.6; // Description lower than menu
    container.position.set(0, yPosition, 0.195);

    // Set explicit render order to avoid z-fighting
    container.renderOrder = 999;

    if (!activeSection) {
      // Main Menu with retro terminal aesthetic

      // Decorative arrows and title
      const mainTitle = new ThreeMeshUI.Block({
        width: 0.85,
        height: 0.1,
        margin: 0.02,
        justifyContent: "center",
        contentDirection: "row",
        backgroundColor: new THREE.Color(0x0a0a0a),
        backgroundOpacity: 0,
        bestFit: "shrink",
      });

      const arrowLeft = new ThreeMeshUI.Text({
        content: "--- ",
        fontSize: 0.05,
        fontColor: new THREE.Color(0xffffff),
      });

      const centerText = new ThreeMeshUI.Text({
        content: "MAIN TERMINAL",
        fontSize: 0.06,
        fontColor: new THREE.Color(0xffffff),
      });

      const arrowRight = new ThreeMeshUI.Text({
        content: " ---",
        fontSize: 0.05,
        fontColor: new THREE.Color(0xffffff),
      });

      mainTitle.add(arrowLeft, centerText, arrowRight);
      container.add(mainTitle);

      // Menu items in 2x2 grid layout
      const gridRow1 = new ThreeMeshUI.Block({
        width: 0.85,
        height: 0.12,
        margin: 0.01,
        justifyContent: "center",
        contentDirection: "row",
        backgroundColor: new THREE.Color(0x0a0a0a),
        backgroundOpacity: 0,
        bestFit: "shrink",
      });

      const gridRow2 = new ThreeMeshUI.Block({
        width: 0.85,
        height: 0.12,
        margin: 0.01,
        justifyContent: "center",
        contentDirection: "row",
        backgroundColor: new THREE.Color(0x0a0a0a),
        backgroundOpacity: 0,
        bestFit: "shrink",
      });

      mainMenuItems.forEach((item, index) => {
        const button = new ThreeMeshUI.Block({
          width: 0.4,
          height: 0.11,
          margin: 0.005,
          padding: 0.01,
          justifyContent: "center",
          contentDirection: "row",
          backgroundColor: new THREE.Color(0x1a1a1a),
          backgroundOpacity: 0.8,
          borderRadius: 0.003,
          borderWidth: 0.003,
          borderColor: new THREE.Color(0xffffff),
          borderOpacity: 0.8,
          bestFit: "shrink",
        });

        const buttonText = new ThreeMeshUI.Text({
          content: item.label.toUpperCase(),
          fontSize: 0.045,
          fontColor: new THREE.Color(0xffffff),
        });

        button.add(buttonText);

        // Add to appropriate row (2x2 grid)
        if (index < 2) {
          gridRow1.add(button);
        } else {
          gridRow2.add(button);
        }

        // Store button data for interaction
        (button as ThreeMeshUIBlock).userData = {
          type: "button",
          action: () => setActiveSection(item.id),
          id: item.id,
        };
      });

      container.add(gridRow1, gridRow2);

      // Decorative separator line
      const separator = new ThreeMeshUI.Block({
        width: 0.85,
        height: 0.005,
        margin: 0.01,
        backgroundColor: new THREE.Color(0xffffff),
        backgroundOpacity: 0.5,
        bestFit: "shrink",
      });
      container.add(separator);

      // Status bar at bottom
      const statusBar = new ThreeMeshUI.Block({
        width: 0.85,
        height: 0.06,
        margin: 0.01,
        padding: 0.01,
        justifyContent: "center",
        contentDirection: "row",
        backgroundColor: new THREE.Color(0x0a0a0a),
        backgroundOpacity: 0,
        bestFit: "shrink",
      });

      // Exit button with red background
      const exitButton = new ThreeMeshUI.Block({
        width: 0.25,
        height: 0.06,
        padding: 0.01,
        justifyContent: "center",
        contentDirection: "row",
        backgroundColor: new THREE.Color(0xff0000),
        backgroundOpacity: 0.8,
        borderRadius: 0.003,
        bestFit: "shrink",
      });

      const exitText = new ThreeMeshUI.Text({
        content: "EXIT",
        fontSize: 0.04,
        fontColor: new THREE.Color(0xffffff),
      });

      exitButton.add(exitText);

      statusBar.add(exitButton);
      container.add(statusBar);

      // Make exit button clickable
      (exitButton as ThreeMeshUIBlock).userData = {
        type: "button",
        action: onExit,
        id: "exit",
      };
    } else {
      // Description view with retro terminal aesthetic
      const section = activeSection
        ? sections[activeSection as SectionKey]
        : null;
      if (section) {
        // Main title with arrows
        const mainTitle = new ThreeMeshUI.Block({
          width: 0.85,
          height: 0.08,
          margin: 0.01,
          justifyContent: "center",
          contentDirection: "row",
          backgroundColor: new THREE.Color(0x0a0a0a),
          backgroundOpacity: 0,
          bestFit: "shrink",
        });

        const arrowLeft = new ThreeMeshUI.Text({
          content: "--- ",
          fontSize: 0.04,
          fontColor: new THREE.Color(0xffffff),
        });

        const centerText = new ThreeMeshUI.Text({
          content: "DATA ACCESS",
          fontSize: 0.05,
          fontColor: new THREE.Color(0xffffff),
        });

        const arrowRight = new ThreeMeshUI.Text({
          content: " ---",
          fontSize: 0.04,
          fontColor: new THREE.Color(0xffffff),
        });

        mainTitle.add(arrowLeft, centerText, arrowRight);
        container.add(mainTitle);

        // Description content with border
        const descBlock = new ThreeMeshUI.Block({
          width: 0.8,
          height: 0.45,
          margin: 0.02,
          padding: 0.04,
          justifyContent: "center",
          contentDirection: "row",
          backgroundColor: new THREE.Color(0x1a1a1a),
          backgroundOpacity: 0.8,
          borderRadius: 0.003,
          borderWidth: 0.003,
          borderColor: new THREE.Color(0xffffff),
          borderOpacity: 0.8,
          bestFit: "auto",
        });

        const descText = new ThreeMeshUI.Text({
          content: section.description,
          fontSize: 0.035,
          fontColor: new THREE.Color(0xffffff),
        });

        descBlock.add(descText);
        container.add(descBlock);

        // Separator
        const separator = new ThreeMeshUI.Block({
          width: 0.85,
          height: 0.005,
          margin: 0.01,
          backgroundColor: new THREE.Color(0xffffff),
          backgroundOpacity: 0.5,
          bestFit: "shrink",
        });
        container.add(separator);

        // Status bar with back button
        const statusBar = new ThreeMeshUI.Block({
          width: 0.85,
          height: 0.06,
          margin: 0.01,
          padding: 0.01,
          justifyContent: "center",
          contentDirection: "row",
          backgroundColor: new THREE.Color(0x0a0a0a),
          backgroundOpacity: 0,
          bestFit: "shrink",
        });

        // Back button with red background
        const backButton = new ThreeMeshUI.Block({
          width: 0.25,
          height: 0.06,
          padding: 0.01,
          justifyContent: "center",
          contentDirection: "row",
          backgroundColor: new THREE.Color(0xff0000),
          backgroundOpacity: 0.8,
          borderRadius: 0.003,
          bestFit: "shrink",
        });

        const backText = new ThreeMeshUI.Text({
          content: "BACK",
          fontSize: 0.04,
          fontColor: new THREE.Color(0xffffff),
        });

        backButton.add(backText);

        statusBar.add(backButton);
        container.add(statusBar);

        (backButton as ThreeMeshUIBlock).userData = {
          type: "button",
          action: () => setActiveSection(null),
          id: "back",
        };
      }
    }

    // Don't add to scene or set state until geometry is initialized
    setIsInitialized(false);
    setUiContainer(null);

    // Initialize geometry over multiple frames to ensure stability
    let frameCount = 0;
    const initializeGeometry = () => {
      ThreeMeshUI.update();
      frameCount++;

      if (frameCount < 3) {
        // Update for 3 frames to ensure all geometry is computed
        requestAnimationFrame(initializeGeometry);
      } else {
        // Now it's safe to add to scene
        if (containerRef.current) {
          containerRef.current.add(container);
          currentContainerRef.current = container;
          setUiContainer(container);
          setIsInitialized(true);
          needsUpdate.current = true; // Ensure first update happens
        }
      }
    };

    initializeGeometry();
  }, [
    activeSection,
    setActiveSection,
    onExit,
    setUiContainer,
    setIsInitialized,
    mainMenuItems,
    sections,
  ]);

  // Handle section changes with animation
  useEffect(() => {
    if (!containerRef.current) return;

    // Completely remove and clean up old UI
    if (currentContainerRef.current) {
      // Remove from scene
      containerRef.current.remove(currentContainerRef.current);

      // Dispose of three-mesh-ui elements
      currentContainerRef.current.clear();

      // Clear refs and state
      currentContainerRef.current = null;
      setUiContainer(null);
      setIsInitialized(false);
    }

    // Small delay to ensure cleanup is complete
    const timer = setTimeout(() => {
      createUI();
    }, 50);

    return () => {
      clearTimeout(timer);
      // Cleanup on unmount - capture refs for safe cleanup
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const container = containerRef.current;
      const currentContainer = currentContainerRef.current;
      if (currentContainer && container) {
        container.remove(currentContainer);
        currentContainerRef.current = null;
      }
    };
  }, [activeSection, createUI]);

  // Handle interactions
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!uiContainer) return;

      // Calculate mouse position in normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const intersects = raycaster.intersectObjects(uiContainer.children, true);

      if (intersects.length > 0) {
        let obj: THREE.Object3D = intersects[0].object;

        // Traverse up to find the interactive element
        while (obj.parent && !obj.userData?.type) {
          obj = obj.parent;
        }

        if (obj.userData?.action) {
          obj.userData.action();
        }
      }
    };

    gl.domElement.addEventListener("click", handleClick);

    return () => {
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [uiContainer, raycaster, camera, gl]);

  // Update ThreeMeshUI and handle hover states
  useFrame(() => {
    if (!uiContainer || !isInitialized) return;

    // Only update ThreeMeshUI when needed (when UI changes)
    if (needsUpdate.current) {
      ThreeMeshUI.update();
      needsUpdate.current = false;
    }

    // Only run raycasting if mouse position changed (optimization)
    const mouseChanged =
      mouse.x !== lastMousePosition.current.x ||
      mouse.y !== lastMousePosition.current.y;

    if (!mouseChanged) return;

    lastMousePosition.current.x = mouse.x;
    lastMousePosition.current.y = mouse.y;

    // Handle hover states
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(uiContainer.children, true);

    if (intersects.length > 0) {
      let obj: THREE.Object3D = intersects[0].object;

      // Traverse up to find the interactive element
      while (obj.parent && !obj.userData?.type) {
        obj = obj.parent;
      }

      if (obj.userData?.id) {
        const uiBlock = obj as ThreeMeshUIBlock;

        // Reset previous hover if different element
        if (
          hoveredElementRef.current &&
          hoveredElementRef.current !== uiBlock
        ) {
          resetButtonColor(hoveredElementRef.current);
          hoveredElementRef.current = null;
        }

        // Set new hover if not already hovering this element
        if (!hoveredElementRef.current) {
          hoveredElementRef.current = uiBlock;
          if (uiBlock.set) {
            uiBlock.set({
              backgroundColor: colors.green,
              backgroundOpacity: 1.0,
            });
            needsUpdate.current = true;
          }
        }
        gl.domElement.style.cursor = "pointer";
      } else {
        // Reset hover when not over any button
        if (hoveredElementRef.current) {
          resetButtonColor(hoveredElementRef.current);
          hoveredElementRef.current = null;
        }
        gl.domElement.style.cursor = "auto";
      }
    } else {
      // Reset hover when no intersections at all
      if (hoveredElementRef.current) {
        resetButtonColor(hoveredElementRef.current);
        hoveredElementRef.current = null;
      }
      gl.domElement.style.cursor = "auto";
    }
  });

  return <group ref={containerRef} />;
}
