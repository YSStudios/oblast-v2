"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import ThreeMeshUI from "three-mesh-ui";

interface ThreeMeshUIMenuProps {
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;
  onExit: () => void;
}

export function ThreeMeshUIMenu({
  activeSection,
  setActiveSection,
  onExit,
}: ThreeMeshUIMenuProps) {
  const containerRef = useRef<THREE.Group>(null);
  const { raycaster, camera, mouse, gl } = useThree();
  const [uiContainer, setUiContainer] = useState<any>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const currentContainerRef = useRef<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [opacity, setOpacity] = useState(1);

  const sections: Record<
    string,
    {
      title: string;
      description: string;
    }
  > = {
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
  };

  const mainMenuItems = [
    { id: "about", label: "About" },
    { id: "team", label: "Team" },
    { id: "services", label: "Services" },
    { id: "contact", label: "Contact" },
  ] as const;

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

    // Reset opacity for fade in
    setOpacity(0);

    // Small delay to ensure cleanup is complete
    const timer = setTimeout(() => {
      createUI();
    }, 50);

    return () => {
      clearTimeout(timer);
      // Cleanup on unmount
      if (currentContainerRef.current && containerRef.current) {
        containerRef.current.remove(currentContainerRef.current);
        currentContainerRef.current = null;
      }
    };
  }, [activeSection]);

  // Create the UI
  const createUI = () => {
    if (!containerRef.current) return;

    // Create main container with explicit dimensions to avoid NaN
    const container = new ThreeMeshUI.Block({
      width: 0.9,
      height: 0.9,
      padding: 0.05,
      justifyContent: "start",
      contentDirection: "column",
      fontFamily: "/fonts/Roboto-msdf.json",
      fontTexture: "/fonts/Roboto-msdf.png",
      backgroundColor: new THREE.Color(0x0a0a0a),
      backgroundOpacity: 0.95,
      bestFit: "shrink",
    });

    // Position higher for better centering in the monitor frame
    const yPosition = activeSection ? 0.63 : 0.54; // Description higher than menu
    container.position.set(0, yPosition, 0.195);

    // Set explicit render order to avoid z-fighting
    container.renderOrder = 999;

    if (!activeSection) {
      // Main Menu
      const header = new ThreeMeshUI.Block({
        width: 0.8,
        height: 0.08,
        margin: 0.02,
        justifyContent: "center",
        contentDirection: "row",
        backgroundColor: new THREE.Color(0x0a0a0a),
        backgroundOpacity: 0,
        bestFit: "shrink",
      });

      const headerText = new ThreeMeshUI.Text({
        content: "=== MAIN MENU ===",
        fontSize: 0.06,
        fontColor: new THREE.Color(0x35c19f),
      });

      header.add(headerText);
      container.add(header);

      // Menu items
      mainMenuItems.forEach((item) => {
        const button = new ThreeMeshUI.Block({
          width: 0.8,
          height: 0.08,
          margin: 0.01,
          justifyContent: "center",
          contentDirection: "row",
          backgroundColor: new THREE.Color(0x0a0a0a),
          backgroundOpacity: 0.5,
          borderRadius: 0.005,
          bestFit: "shrink",
        });

        const buttonText = new ThreeMeshUI.Text({
          content: item.label.toUpperCase(),
          fontSize: 0.9,
          fontColor: new THREE.Color(0x35c19f),
        });

        button.add(buttonText);
        container.add(button);

        // Store button data for interaction
        (button as any).userData = {
          type: "button",
          action: () => setActiveSection(item.id),
          id: item.id,
        };
      });

      // Exit button
      const exitButton = new ThreeMeshUI.Block({
        width: 0.8,
        height: 0.08,
        margin: 0.02,
        justifyContent: "center",
        contentDirection: "row",
        backgroundColor: new THREE.Color(0x0a0a0a),
        backgroundOpacity: 0.5,
        borderRadius: 0.005,
        bestFit: "shrink",
      });

      const exitText = new ThreeMeshUI.Text({
        content: "[ESC] Exit",
        fontSize: 0.035,
        fontColor: new THREE.Color(0xff3333),
      });

      exitButton.add(exitText);
      container.add(exitButton);

      (exitButton as any).userData = {
        type: "button",
        action: onExit,
        id: "exit",
      };
    } else {
      // Description view
      const section = sections[activeSection];
      if (section) {
        const header = new ThreeMeshUI.Block({
          width: 0.8,
          height: 0.1,
          margin: 0.02,
          justifyContent: "center",
          contentDirection: "row",
          backgroundColor: new THREE.Color(0x0a0a0a),
          backgroundOpacity: 0,
          bestFit: "shrink",
        });

        const headerText = new ThreeMeshUI.Text({
          content: `=== ${section.title.toUpperCase()} ===`,
          fontSize: 0.045,
          fontColor: new THREE.Color(0x35c19f),
        });

        header.add(headerText);
        container.add(header);

        // Description content
        const descBlock = new ThreeMeshUI.Block({
          width: 0.8,
          height: 0.5,
          margin: 0.02,
          padding: 0.05,
          justifyContent: "center",
          contentDirection: "row",
          backgroundColor: new THREE.Color(0x0a0a0a),
          backgroundOpacity: 0.3,
          borderRadius: 0.01,
          bestFit: "auto",
        });

        const descText = new ThreeMeshUI.Text({
          content: section.description,
          fontSize: 0.95,
          fontColor: new THREE.Color(0xcccccc),
        });

        descBlock.add(descText);
        container.add(descBlock);

        // Back button
        const backButton = new ThreeMeshUI.Block({
          width: 0.8,
          height: 0.08,
          margin: 0.02,
          justifyContent: "center",
          contentDirection: "row",
          backgroundColor: new THREE.Color(0x0a0a0a),
          backgroundOpacity: 0.5,
          borderRadius: 0.005,
          bestFit: "shrink",
        });

        const backText = new ThreeMeshUI.Text({
          content: "[ESC] BACK TO MENU",
          fontSize: 0.035,
          fontColor: new THREE.Color(0x35c19f),
        });

        backButton.add(backText);
        container.add(backButton);

        (backButton as any).userData = {
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
        }
      }
    };

    initializeGeometry();
  };

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
        let obj: any = intersects[0].object;

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

  // Update ThreeMeshUI, handle hover, and animate opacity
  useFrame((state, delta) => {
    if (!uiContainer || !isInitialized) return;

    ThreeMeshUI.update();

    // Fade in animation
    if (opacity < 1) {
      const newOpacity = Math.min(1, opacity + delta * 4);
      setOpacity(newOpacity);

      // Apply opacity to container and all children
      if (uiContainer && uiContainer.set) {
        uiContainer.set({ backgroundOpacity: 0.95 * newOpacity });

        // Also fade in all text elements
        uiContainer.traverse((child: any) => {
          if (child.isUI && child.set) {
            const currentBgOpacity = child.backgroundOpacity || 0;
            if (currentBgOpacity > 0) {
              child.set({ backgroundOpacity: currentBgOpacity * newOpacity });
            }
          }
        });
      }
    }

    // Handle hover states
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(uiContainer.children, true);

    if (intersects.length > 0) {
      let obj: any = intersects[0].object;

      // Traverse up to find the interactive element
      while (obj.parent && !obj.userData?.type) {
        obj = obj.parent;
      }

      if (obj.userData?.id) {
        if (hoveredItem !== obj.userData.id) {
          setHoveredItem(obj.userData.id);
          // Change background color on hover
          if (obj.set) {
            const hoverColor =
              obj.userData.id === "exit"
                ? new THREE.Color(0xff3333)
                : new THREE.Color(0x35c19f);
            obj.set({
              backgroundColor: hoverColor,
              backgroundOpacity: 0.3,
            });
          }
        }
        gl.domElement.style.cursor = "pointer";
      } else {
        if (hoveredItem) {
          setHoveredItem(null);
          // Reset all interactive elements
          uiContainer.children.forEach((child: any) => {
            if (child.userData?.type && child.set) {
              child.set({
                backgroundColor: new THREE.Color(0x0a0a0a),
                backgroundOpacity: 0.5,
              });
            }
          });
        }
        gl.domElement.style.cursor = "auto";
      }
    } else {
      if (hoveredItem) {
        setHoveredItem(null);
        // Reset all interactive elements
        uiContainer.children.forEach((child: any) => {
          if (child.userData?.type && child.set) {
            child.set({
              backgroundColor: new THREE.Color(0x0a0a0a),
              backgroundOpacity: 0.5,
            });
          }
        });
      }
      gl.domElement.style.cursor = "auto";
    }
  });

  return <group ref={containerRef} />;
}
