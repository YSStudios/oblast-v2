# Required Assets for 3D Scene

To make this 3D scene work, you need to add the following assets to your `/public` directory:

## Required Files

### 1. 3D Model File
- **File**: `computers_1-transformed.glb`
- **Location**: `/public/models/computers_1-transformed.glb`
- **Source**: This is from the "Old Computers" model by Rafael Rodrigues
  - Sketchfab URL: https://sketchfab.com/3d-models/old-computers-7bb6e720499a467b8e0427451d180063
  - License: CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
  - Author: Rafael Rodrigues (https://sketchfab.com/RafaelBR873D)

**How to get it:**
1. Download the original model from Sketchfab (link above)
2. Use `gltfjsx` to transform it with instancing:
   ```bash
   npx gltfjsx computers.glb --transform --instance
   ```
3. Place the transformed file (`computers_1-transformed.glb`) in the `/public` folder

### 2. Font File
- **File**: `Inter-Medium.woff`
- **Location**: `/public/Inter-Medium.woff`
- **Source**: Inter font family (https://rsms.me/inter/)

**How to get it:**
1. Download from https://rsms.me/inter/
2. Extract the `Inter-Medium.woff` file
3. Place it in the `/public` folder

## Quick Setup

1. Create the public directory if it doesn't exist:
   ```bash
   mkdir -p public
   ```

2. Download and add the required files to the public directory:
   ```
   public/
   ├── models/
   │   └── computers_1-transformed.glb
   └── Inter-Medium.woff
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

## Alternative: Use Different Models

If you want to use different 3D models:
1. Update the model path in `/src/components/3d/Computers.tsx`
2. Update the node names to match your new model's structure
3. Adjust the Scene component in `/src/components/3d/Scene.tsx` as needed

## Notes

- The bunny model is loaded from `@pmndrs/assets` package (already installed)
- Make sure the model file is optimized and transformed for better performance
- The GLB format is recommended for web use (smaller file size compared to GLTF)
