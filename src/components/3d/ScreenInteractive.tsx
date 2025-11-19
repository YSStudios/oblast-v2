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
  const { currentScreenId, zoomInComplete } = useScreenFocus();
  const isFocused = currentScreenId === props.panel && zoomInComplete;

  const sections: Record<string, { title: string; content: string[] }> = {
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
        "Consulting - Strategic technology",
        "guidance",
        "",
        "Support & Maintenance - Ongoing",
        "care for your digital solutions",
      ],
    },
    contact: {
      title: "Contact Us",
      content: [
        "Email: hello@example.com",
        "",
        "Phone: +1 (555) 123-4567",
        "",
        "Address:",
        "123 Innovation Street",
        "Tech City, TC 12345",
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
                <div style={{
                  borderTop: "1px solid #5555FF",
                  marginTop: "5px",
                  paddingTop: "3px",
                  textAlign: "center",
                  color: "#AAAAAA",
                  fontSize: "9px",
                  textShadow: "0 0 6px rgba(170, 170, 170, 0.6)"
                }}>
                  [ESC] Exit
                </div>
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
                    {sections[activeSection]?.content.map((line) => (
                      <p key={line} style={{ 
                        margin: line === "" ? "8px 0" : "3px 0",
                        opacity: line === "" ? 0 : 1
                      }}>
                        {line === "" ? "\u00A0" : `${line}`}
                      </p>
                    ))}
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

