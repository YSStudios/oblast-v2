"use client";

import { useState } from "react";
import { PerspectiveCamera, Html } from "@react-three/drei";
import { Screen } from "./Screen";
import { useScreenFocus } from "./ScreenFocusContext";
import { ScreenSaver } from "./ScreenSaver";
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { currentScreenId, zoomInComplete, clearFocus, screens } = useScreenFocus();
  const isFocused = currentScreenId === props.panel && zoomInComplete;

  // Function to focus on a video screen
  const focusVideoScreen = (panelId: string) => {
    const screen = screens.find((s) => s.id === panelId);
    if (screen && screen.handleClick) {
      // Clear current focus first, then focus on the target screen
      clearFocus();
      // Small delay to allow zoom out before zooming in
      setTimeout(() => {
        screen.handleClick();
      }, 100);
    } else {
      console.warn(`Screen with panel ID "${panelId}" not found. Available screens:`, screens.map(s => s.id));
    }
  };

  const sections: Record<
    string,
    {
      title: string;
      content: string[];
      links?: Array<{ line: number; panelId: string }>;
    }
  > = {
    about: {
      title: "About Us",
      content: [
        "We are a forward-thinking technology company",
        "dedicated to creating innovative solutions",
        "that transform businesses and enhance",
        "user experiences.",
      ],
    },
    team: {
      title: "Our Team",
      content: [
        "Leadership - Experienced professionals",
        "leading innovation",
        "",
        "Developers - Talented engineers",
        "building the future",
        "",
        "Designers - Creative minds",
        "shaping user experiences",
      ],
    },
    services: {
      title: "Our Services",
      content: [
        "Web Development - Custom web",
        "applications and platforms",
        "",
        "3D Visualization - Interactive 3D",
        "experiences and graphics",
        "",
        "Case Studies:",
        "",
        ">1 - Kirill.Agency",
        ">2 - Bourne Creatives",
        ">3 - Vega.Earth",
        "",
        "Consulting - Strategic technology",
        "guidance",
        "",
        "Support & Maintenance - Ongoing",
        "care for your digital solutions",
      ],
      links: [
        { line: 8, panelId: "LCDScreen001" },   // Case Study 1 - Kirill.Agency (index 8)
        { line: 9, panelId: "LCDScreen004" },   // Case Study 2 - Bourne Creatives (index 9)
        { line: 10, panelId: "LCDScreen" },     // Case Study 3 - Vega.Earth (index 10)
      ],
    },
    contact: {
      title: "Contact Us",
      content: ["Email: oblaststudio@gmail.com", "Located: NYC/Baltimore"],
    },
  };

  const mainMenuItems = [
    { id: "about", label: "About" },
    { id: "team", label: "Team" },
    { id: "services", label: "Services" },
    { id: "contact", label: "Contact" },
  ] as const;

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
          <Html
            className="content"
            position={[0, 0, .195]}
            transform
            occlude
            distanceFactor={2}
          >
            <div
              className="screen-content-wrapper"
              onPointerDown={(e) => {
                // Only stop propagation when focused and zoom is complete
                if (isFocused) {
                  e.stopPropagation();
                }
              }}
            >
            {!activeSection ? (
              <nav className="screen-menu" aria-label="Main menu">
                <div className="screen-menu-header">╔═══ MAIN MENU ═══╗</div>
                <ul className="screen-menu-list" role="list">
                  {mainMenuItems.map((item) => {
                    const isHovered = hoveredItem === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`screen-menu-button${isHovered ? " is-hovered" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSection(item.id);
                          }}
                          onMouseEnter={() => setHoveredItem(item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          {isHovered ? "► " : "  "}
                          {item.label.toUpperCase()}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <button
                  type="button"
                  className={`screen-menu-button screen-menu-exit${hoveredItem === "exit" ? " is-hovered" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFocus();
                  }}
                  onMouseEnter={() => setHoveredItem("exit")}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {hoveredItem === "exit" ? "► " : ""}
                  [ESC] Exit
                </button>
              </nav>
            ) : (
              <section className="screen-scrollable-content screen-section" aria-live="polite">
                <div className="screen-section-wrapper">
                  <div className="screen-section-header">
                    ╔═══ {sections[activeSection]?.title.toUpperCase()} ═══╗
                  </div>
                  <div className="screen-section-body">
                    {sections[activeSection]?.content.map((line, index) => {
                      const isLink =
                        activeSection === "services" &&
                        sections.services?.links?.some(
                          (link) => link.line === index && line.startsWith(">")
                        );
                      const linkData =
                        activeSection === "services" &&
                        sections.services?.links?.find((link) => link.line === index);
                      const isLinkHovered = linkData && hoveredItem === `link-${linkData.panelId}`;

                      if (isLink && linkData) {
                        return (
                          <button
                            type="button"
                            key={`${line}-${index}`}
                            className={`screen-section-link${isLinkHovered ? " is-hovered" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              focusVideoScreen(linkData.panelId);
                            }}
                            onMouseEnter={() => setHoveredItem(`link-${linkData.panelId}`)}
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            {isLinkHovered ? "► " : "  "}
                            {line}
                          </button>
                        );
                      }

                      const isSpacer = line === "";
                      return (
                        <p
                          key={`${line}-${index}`}
                          className={`screen-section-line${isSpacer ? " is-space" : ""}`}
                        >
                          {isSpacer ? "\u00A0" : line}
                        </p>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  className={`screen-section-back${hoveredItem === "back" ? " is-hovered" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSection(null);
                  }}
                  onMouseEnter={() => setHoveredItem("back")}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {hoveredItem === "back" ? "► " : "  "}
                  [ESC] BACK TO MENU
                </button>
              </section>
            )}
          </div>
        </Html>
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

