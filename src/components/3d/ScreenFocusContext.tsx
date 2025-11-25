"use client";

import * as THREE from "three";
import {
  useContext,
  createContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { FocusTarget, ScreenRegistration } from "./types";

interface ScreenFocusContextType {
  focusTarget: FocusTarget | null;
  setFocusTarget: (target: FocusTarget) => void;
  clearFocus: () => void;
  completeClearFocus: () => void;
  isTransitioning: boolean;
  transitionStartTime: number | null;
  zoomInComplete: boolean;
  setZoomInComplete: (complete: boolean) => void;
  mouseFollowEnabled: boolean;
  toggleMouseFollow: () => void;
  registerScreen: (
    id: string,
    handleClick: () => void,
    ref: React.RefObject<THREE.Mesh | null> | null,
    name?: string,
    description?: string,
    url?: string,
    descriptionOffset?: {
      forward?: number;
      up?: number;
      textY?: number;
    }
  ) => void;
  unregisterScreen: (id: string) => void;
  currentScreenId: string | null;
  setCurrentScreenId: (id: string) => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
  screens: ScreenRegistration[];
}

const ScreenFocusContext = createContext<ScreenFocusContextType | null>(null);

export function ScreenFocusProvider({ children }: { children: ReactNode }) {
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionStartTime, setTransitionStartTime] = useState<number | null>(
    null
  );
  const [zoomInComplete, setZoomInComplete] = useState(false);
  const [mouseFollowEnabled, setMouseFollowEnabled] = useState(true);
  const [screens, setScreens] = useState<ScreenRegistration[]>([]);
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);

  const registerScreen = useCallback(
    (
      id: string,
      handleClick: () => void,
      ref: React.RefObject<THREE.Mesh | null> | null,
      name?: string,
      description?: string,
      url?: string,
      descriptionOffset?: {
        forward?: number;
        up?: number;
        textY?: number;
      }
    ) => {
      setScreens((prev: ScreenRegistration[]) => {
        // Prevent duplicates
        if (prev.find((s: ScreenRegistration) => s.id === id)) return prev;
        return [
          ...prev,
          { id, handleClick, ref, name, description, url, descriptionOffset },
        ];
      });
    },
    []
  );

  const unregisterScreen = useCallback((id: string) => {
    setScreens((prev: ScreenRegistration[]) =>
      prev.filter((s: ScreenRegistration) => s.id !== id)
    );
  }, []);

  const navigateNext = useCallback(() => {
    if (!currentScreenId || screens.length === 0) return;
    const currentIndex = screens.findIndex(
      (s: ScreenRegistration) => s.id === currentScreenId
    );
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % screens.length;
    screens[nextIndex].handleClick();
  }, [currentScreenId, screens]);

  const navigatePrevious = useCallback(() => {
    if (!currentScreenId || screens.length === 0) return;
    const currentIndex = screens.findIndex(
      (s: ScreenRegistration) => s.id === currentScreenId
    );
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + screens.length) % screens.length;
    screens[prevIndex].handleClick();
  }, [currentScreenId, screens]);

  const clearFocus = useCallback(() => {
    setIsTransitioning(true);
    setTransitionStartTime(Date.now());
    setZoomInComplete(false); // Immediately hide text when zoom out starts
    // Don't clear focus target immediately - let the transition complete
  }, []);

  const handleSetFocus = useCallback((target: FocusTarget) => {
    setIsTransitioning(false);
    setTransitionStartTime(null);
    setZoomInComplete(false); // Reset when starting new zoom
    setFocusTarget(target);
    // Dispatch event for UI
    window.dispatchEvent(
      new CustomEvent("screenFocusChange", { detail: { focused: true } })
    );
  }, []);

  const completeClearFocus = useCallback(() => {
    setFocusTarget(null);
    setIsTransitioning(false);
    setTransitionStartTime(null);
    setZoomInComplete(false);
    setCurrentScreenId(null);
    // Dispatch event for UI
    window.dispatchEvent(
      new CustomEvent("screenFocusChange", { detail: { focused: false } })
    );
  }, []);

  const toggleMouseFollow = useCallback(() => {
    setMouseFollowEnabled((prev: boolean) => !prev);
  }, []);

  return (
    <ScreenFocusContext.Provider
      value={{
        focusTarget,
        setFocusTarget: handleSetFocus,
        clearFocus,
        completeClearFocus,
        isTransitioning,
        transitionStartTime,
        zoomInComplete,
        setZoomInComplete,
        mouseFollowEnabled,
        toggleMouseFollow,
        registerScreen,
        unregisterScreen,
        currentScreenId,
        setCurrentScreenId,
        navigateNext,
        navigatePrevious,
        screens,
      }}
    >
      {children}
    </ScreenFocusContext.Provider>
  );
}

export function useScreenFocus() {
  const context = useContext(ScreenFocusContext);
  if (!context) {
    throw new Error("useScreenFocus must be used within ScreenFocusProvider");
  }
  return context;
}

