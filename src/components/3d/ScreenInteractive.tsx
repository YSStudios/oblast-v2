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

  const sections: Record<string, { 
    title: string; 
    content: string[]; 
    links?: Array<{ line: number; panelId: string }> 
  }> = {
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
      content: [
        "Email: oblaststudio@gmail.com",,
        "Located: NYC/Baltimore"
      ],
    },
  };

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
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0",
                  alignItems: "stretch",
                  justifyContent: "center",
                  overflow: "hidden",
                  boxSizing: "border-box",
                  padding: "8px",
                }}
              >
                <div style={{
                  borderBottom: "1px solid #5555FF",
                  paddingBottom: "3px",
                  marginBottom: "5px",
                  textAlign: "center",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  textShadow: "0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(85, 85, 255, 0.5)"
                }}>
                  ╔═══ MAIN MENU ═══╗
                </div>
                {["About", "Team", "Services", "Contact"].map((item) => (
                  <button
                    key={item}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSection(item.toLowerCase());
                    }}
                    onMouseEnter={() => setHoveredItem(item.toLowerCase())}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      background: hoveredItem === item.toLowerCase() ? "#FFFFFF" : "transparent",
                      border: "none",
                      color: hoveredItem === item.toLowerCase() ? "#0000AA" : "#FFFF55",
                      fontSize: "13px",
                      cursor: "pointer",
                      padding: "4px 10px",
                      textAlign: "left",
                      transition: "all 0.1s ease",
                      fontFamily: "'Courier New', monospace",
                      fontWeight: "bold",
                      marginBottom: "1px",
                      textShadow: hoveredItem === item.toLowerCase() 
                        ? "none"
                        : "0 0 8px rgba(255, 255, 85, 0.8), 0 0 15px rgba(255, 255, 85, 0.4)"
                    }}
                  >
                    {hoveredItem === item.toLowerCase() ? "► " : "  "}{item.toUpperCase()}
                  </button>
                ))}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFocus();
                  }}
                  onMouseEnter={() => setHoveredItem("exit")}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    marginTop: "5px",
                    paddingTop: "3px",
                    textAlign: "center",
                    background: hoveredItem === "exit" ? "#FFFFFF" : "transparent",
                    border: "none",
                    borderTop: "1px solid #5555FF",
                    color: hoveredItem === "exit" ? "#0000AA" : "#AAAAAA",
                    fontSize: "9px",
                    textShadow: hoveredItem === "exit" 
                      ? "none"
                      : "0 0 6px rgba(170, 170, 170, 0.6)",
                    cursor: "pointer",
                    width: "100%",
                    fontFamily: "'Courier New', monospace",
                    transition: "all 0.1s ease",
                    padding: "3px 0"
                  }}
                >
                  {hoveredItem === "exit" ? "► " : ""}[ESC] Exit
                </button>
              </div>
            ) : (
              <div className="screen-scrollable-content" style={{
                fontFamily: "'Courier New', monospace",
                padding: "10px"
              }}>
                <div style={{ 
                  width: "100%", 
                  textAlign: "left"
                }}>
                  <div style={{
                    borderBottom: "1px solid #5555FF",
                    paddingBottom: "5px",
                    marginBottom: "10px",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                    textShadow: "0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(85, 85, 255, 0.5)"
                  }}>
                    ╔═══ {sections[activeSection]?.title.toUpperCase()} ═══╗
                  </div>
                  <div style={{ 
                    fontSize: "11px", 
                    lineHeight: "1.5", 
                    color: "#FFFFFF",
                    marginBottom: "15px",
                    textShadow: "0 0 8px rgba(255, 255, 255, 0.6), 0 0 15px rgba(200, 200, 255, 0.3)"
                  }}>
                    {sections[activeSection]?.content.map((line, index) => {
                      // Check if this line is a clickable link
                      const isLink = activeSection === "services" && 
                        sections.services?.links?.some(
                          (link) => link.line === index && line.startsWith(">")
                        );
                      const linkData = activeSection === "services" && sections.services?.links?.find(
                        (link) => link.line === index
                      );
                      const isLinkHovered = linkData && hoveredItem === `link-${linkData.panelId}`;

                      if (isLink && linkData) {
                        return (
                          <button
                            key={`${line}-${index}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              focusVideoScreen(linkData.panelId);
                            }}
                            onMouseEnter={() => setHoveredItem(`link-${linkData.panelId}`)}
                            onMouseLeave={() => setHoveredItem(null)}
                            style={{
                              background: isLinkHovered ? "#FFFFFF" : "transparent",
                              border: "none",
                              color: isLinkHovered ? "#0000AA" : "#FFFF55",
                              fontSize: "11px",
                              cursor: "pointer",
                              padding: "3px 0",
                              margin: "3px 0",
                              textAlign: "left",
                              width: "100%",
                              fontFamily: "'Courier New', monospace",
                              fontWeight: "bold",
                              transition: "all 0.1s ease",
                              textShadow: isLinkHovered 
                                ? "none"
                                : "0 0 8px rgba(255, 255, 85, 0.8), 0 0 15px rgba(255, 255, 85, 0.4)"
                            }}
                          >
                            {isLinkHovered ? "► " : "  "}{line}
                          </button>
                        );
                      }

                      return (
                        <p key={`${line}-${index}`} style={{ 
                          margin: line === "" ? "8px 0" : "3px 0",
                          opacity: line === "" ? 0 : 1
                        }}>
                          {line === "" ? "\u00A0" : `${line}`}
                        </p>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSection(null);
                  }}
                  onMouseEnter={() => setHoveredItem("back")}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    marginTop: "auto",
                    marginBottom: "0px",
                    background: hoveredItem === "back" ? "#FFFFFF" : "transparent",
                    border: "none",
                    color: hoveredItem === "back" ? "#0000AA" : "#FFFF55",
                    fontSize: "12px",
                    cursor: "pointer",
                    padding: "5px 10px",
                    transition: "all 0.1s ease",
                    fontFamily: "'Courier New', monospace",
                    fontWeight: "bold",
                    flexShrink: 0,
                    textAlign: "left",
                    width: "100%",
                    textShadow: hoveredItem === "back" 
                      ? "none"
                      : "0 0 8px rgba(255, 255, 85, 0.8), 0 0 15px rgba(255, 255, 85, 0.4)"
                  }}
                >
                  {hoveredItem === "back" ? "► " : "  "}[ESC] BACK TO MENU
                </button>
              </div>
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

