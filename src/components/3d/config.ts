// Camera focus configuration - adjust these values to change how the camera behaves when focusing on screens
export const CAMERA_FOCUS_CONFIG = {
  // Distance multiplier: how far back the camera sits from the screen
  // Higher = farther away (more context visible), Lower = closer (screen fills more of view)
  distanceMultiplier: 3,

  // Field of view in degrees (should match the main camera FOV in Scene.tsx)
  // Higher = wider view, Lower = tighter view
  fov: 60,

  // Near clipping plane: how close objects can be before being clipped
  // Lower = can see objects closer to camera (e.g., 0.1), Higher = objects closer than this are clipped (e.g., 0.5)
  near: 0.1,

  // Far clipping plane: how far objects can be before being clipped
  // Higher = can see objects farther away (e.g., 50), Lower = objects farther than this are clipped (e.g., 20)
  far: 50,
} as const;

